"""
Messaging routes for LocaTrack API
"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime

from config import db
from models import User, UserRole, Message, Conversation, MessageCreate, ConversationCreate
from utils.auth import get_current_user

router = APIRouter(prefix="/messages", tags=["Messages"])


@router.get("/conversations")
async def get_conversations(
    current_user: User = Depends(get_current_user)
):
    """Get all conversations for current user"""
    conversations = await db.conversations.find(
        {"participants": current_user.id},
        {"_id": 0}
    ).sort("last_message_at", -1).to_list(100)
    
    for c in conversations:
        for date_field in ['created_at', 'last_message_at']:
            if c.get(date_field) and isinstance(c[date_field], str):
                c[date_field] = datetime.fromisoformat(c[date_field])
    
    return conversations


@router.post("/conversations")
async def create_conversation(
    conv_create: ConversationCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new conversation with another user"""
    other_user = await db.users.find_one({"id": conv_create.participant_id}, {"_id": 0, "password": 0})
    if not other_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    existing = await db.conversations.find_one({
        "participants": {"$all": [current_user.id, conv_create.participant_id]}
    }, {"_id": 0})
    
    if existing:
        if existing.get('created_at') and isinstance(existing['created_at'], str):
            existing['created_at'] = datetime.fromisoformat(existing['created_at'])
        if existing.get('last_message_at') and isinstance(existing['last_message_at'], str):
            existing['last_message_at'] = datetime.fromisoformat(existing['last_message_at'])
        return existing
    
    conversation = Conversation(
        participants=[current_user.id, conv_create.participant_id],
        participant_names=[current_user.full_name, other_user['full_name']],
        unread_count={current_user.id: 0, conv_create.participant_id: 0}
    )
    
    doc = conversation.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.conversations.insert_one(doc)
    return conversation


@router.get("/conversations/{conversation_id}")
async def get_conversation_messages(
    conversation_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get all messages in a conversation"""
    conversation = await db.conversations.find_one(
        {"id": conversation_id, "participants": current_user.id},
        {"_id": 0}
    )
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    messages = await db.messages.find(
        {"conversation_id": conversation_id},
        {"_id": 0}
    ).sort("created_at", 1).to_list(1000)
    
    for m in messages:
        if m.get('created_at') and isinstance(m['created_at'], str):
            m['created_at'] = datetime.fromisoformat(m['created_at'])
    
    await db.messages.update_many(
        {"conversation_id": conversation_id, "sender_id": {"$ne": current_user.id}, "read": False},
        {"$set": {"read": True}}
    )
    
    await db.conversations.update_one(
        {"id": conversation_id},
        {"$set": {f"unread_count.{current_user.id}": 0}}
    )
    
    return messages


@router.post("/send")
async def send_message(
    message_create: MessageCreate,
    current_user: User = Depends(get_current_user)
):
    """Send a message in a conversation"""
    conversation = await db.conversations.find_one(
        {"id": message_create.conversation_id, "participants": current_user.id},
        {"_id": 0}
    )
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    message = Message(
        conversation_id=message_create.conversation_id,
        sender_id=current_user.id,
        sender_name=current_user.full_name,
        sender_role=current_user.role,
        content=message_create.content
    )
    
    doc = message.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.messages.insert_one(doc)
    
    other_participant = [p for p in conversation['participants'] if p != current_user.id][0]
    current_unread = conversation.get('unread_count', {}).get(other_participant, 0)
    
    await db.conversations.update_one(
        {"id": message_create.conversation_id},
        {
            "$set": {
                "last_message": message_create.content[:100],
                "last_message_at": doc['created_at'],
                f"unread_count.{other_participant}": current_unread + 1
            }
        }
    )
    
    return message


@router.get("/unread-count")
async def get_unread_count(
    current_user: User = Depends(get_current_user)
):
    """Get total unread messages count"""
    conversations = await db.conversations.find(
        {"participants": current_user.id},
        {"_id": 0, "unread_count": 1}
    ).to_list(100)
    
    total = sum(c.get('unread_count', {}).get(current_user.id, 0) for c in conversations)
    return {"unread_count": total}


@router.get("/users")
async def get_available_users_for_chat(
    current_user: User = Depends(get_current_user)
):
    """Get users available for chat within the same tenant"""
    if current_user.role == UserRole.SUPERADMIN:
        query = {"id": {"$ne": current_user.id}}
    elif current_user.role == UserRole.LOCATEUR:
        query = {
            "id": {"$ne": current_user.id},
            "$or": [
                {"tenant_id": current_user.id},
                {"id": current_user.id}
            ]
        }
    else:
        tenant_id = current_user.tenant_id
        if not tenant_id:
            return []
        query = {
            "id": {"$ne": current_user.id},
            "$or": [
                {"id": tenant_id},
                {"tenant_id": tenant_id}
            ]
        }
    
    users = await db.users.find(query, {"_id": 0, "password": 0}).to_list(100)
    
    for u in users:
        if u.get('created_at') and isinstance(u['created_at'], str):
            u['created_at'] = datetime.fromisoformat(u['created_at'])
    
    return users
