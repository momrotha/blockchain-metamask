from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
import models
import database
from pydantic import BaseModel
from web3 import Web3
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import shutil
import hashlib

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Connect to blockchain (local node or Sepolia testnet via Alchemy)
WEB3_PROVIDER_URL = os.getenv('WEB3_PROVIDER_URL', 'http://127.0.0.1:8545')
w3 = Web3(Web3.HTTPProvider(WEB3_PROVIDER_URL))

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.on_event("startup")
def startup_event():
    db = database.SessionLocal()
    if db.query(models.Product).count() == 0:
        products = [
            models.Product(name="T-Shirt", description="A premium cotton t-shirt with a Web3 logo.", price_eth=0.01, image_url="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"),
            models.Product(name="Book", description="The definitive guide to understanding Ethereum.", price_eth=0.02, image_url="https://images.unsplash.com/photo-1589998059171-988d887df646?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"),
            models.Product(name="Coffee", description="Specialty roasted beans to fuel your late-night coding sessions.", price_eth=0.005, image_url="https://images.unsplash.com/photo-1559525839-b184a4d698c7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"),
            models.Product(name="Keyboard", description="Mechanical keyboard with RGB lighting.", price_eth=0.05, image_url="https://images.unsplash.com/photo-1595225476474-87563907a212?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80")
        ]
        db.add_all(products)
        db.commit()
        
    if db.query(models.User).filter(models.User.email == "admin@shop.com").count() == 0:
        hashed = hashlib.sha256("admin123".encode()).hexdigest()
        admin_user = models.User(email="admin@shop.com", name="Super Admin", password_hash=hashed, is_admin=True)
        db.add(admin_user)
        db.commit()
    db.close()

class UserRegister(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserUpdate(BaseModel):
    name: str

@app.post("/register")
def register_user(user: UserRegister, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # In a real app, use bcrypt to hash. Here we use sha256 for demo simplicity.
    hashed = hashlib.sha256(user.password.encode()).hexdigest()
    
    new_user = models.User(email=user.email, name=user.name, password_hash=hashed)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"email": new_user.email, "name": new_user.name, "avatar_url": new_user.avatar_url, "is_admin": new_user.is_admin}

@app.post("/login")
def login_user(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    hashed = hashlib.sha256(user.password.encode()).hexdigest()
    if db_user.password_hash != hashed:
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    return {"email": db_user.email, "name": db_user.name, "avatar_url": db_user.avatar_url, "is_admin": db_user.is_admin}

@app.put("/users/{email}")
def update_user(email: str, user: UserUpdate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == email).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db_user.name = user.name
    db.commit()
    db.refresh(db_user)
    return {"email": db_user.email, "name": db_user.name, "avatar_url": db_user.avatar_url, "is_admin": db_user.is_admin}

@app.post("/users/{email}/avatar")
def upload_avatar(email: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == email).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    file_location = f"uploads/{email}_{file.filename}"
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    avatar_url = f"http://127.0.0.1:8000/{file_location}"
    db_user.avatar_url = avatar_url
    db.commit()
    return {"avatar_url": avatar_url}

class OrderCreate(BaseModel):
    product_id: int
    customer_address: str
    user_email: str = None
    status: str = "pending"
    failure_reason: str = None

class OrderFail(BaseModel):
    order_id: int
    reason: str

class PaymentVerify(BaseModel):
    order_id: int
    tx_hash: str

@app.get("/products")
def get_products(db: Session = Depends(get_db)):
    return db.query(models.Product).all()

@app.post("/orders")
def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == order.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db_order = models.Order(
        product_id=order.product_id, 
        customer_address=order.customer_address, 
        user_email=order.user_email,
        status=order.status,
        failure_reason=order.failure_reason
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order

@app.post("/orders/fail")
def mark_order_failed(fail: OrderFail, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == fail.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = "failed"
    order.failure_reason = fail.reason
    db.commit()
    return {"status": "order marked as failed", "reason": fail.reason}

@app.get("/orders/{email}")
def get_user_orders(email: str, db: Session = Depends(get_db)):
    orders = db.query(models.Order).filter(models.Order.user_email == email).order_by(models.Order.id.desc()).all()
    result = []
    for o in orders:
        product = db.query(models.Product).filter(models.Product.id == o.product_id).first()
        result.append({
            "id": o.id,
            "product_name": product.name if product else "Unknown",
            "price_eth": product.price_eth if product else 0,
            "status": o.status,
            "tx_hash": o.tx_hash,
            "failure_reason": o.failure_reason
        })
    return result

@app.post("/verify-payment")
def verify_payment(payment: PaymentVerify, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == payment.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.status == "paid":
        return {"status": "already paid"}

    if payment.tx_hash == "FIAT":
        order.status = "paid"
        order.tx_hash = "FIAT"
        db.commit()
        return {"status": "payment verified"}

    try:
        tx = w3.eth.get_transaction(payment.tx_hash)
        receipt = w3.eth.get_transaction_receipt(payment.tx_hash)
        
        if receipt and receipt.status == 1:
            order.status = "paid"
            order.tx_hash = payment.tx_hash
            db.commit()
            return {"status": "payment verified"}
        else:
            order.status = "failed"
            order.tx_hash = payment.tx_hash
            order.failure_reason = "Transaction failed on blockchain (receipt status 0)"
            db.commit()
            raise HTTPException(status_code=400, detail="Transaction failed on blockchain")
    except Exception as e:
        order.status = "failed"
        order.failure_reason = f"Blockchain error: {str(e)}"
        db.commit()
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/admin/users")
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    return [{"email": u.email, "name": u.name, "is_admin": u.is_admin, "avatar_url": u.avatar_url} for u in users]

@app.delete("/admin/users/{email}")
def delete_user(email: str, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == email).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    if db_user.is_admin:
        raise HTTPException(status_code=400, detail="Cannot delete an admin user")
    db.delete(db_user)
    db.commit()
    return {"status": "success"}

# ─── Admin: Products CRUD ────────────────────────────────────────────────────
class ProductCreate(BaseModel):
    name: str
    description: str
    price_eth: float
    image_url: str
    category: str = "General"

@app.get("/admin/products")
def admin_get_products(db: Session = Depends(get_db)):
    return db.query(models.Product).all()

@app.post("/admin/products")
def admin_create_product(product: ProductCreate, db: Session = Depends(get_db)):
    new_product = models.Product(**product.dict())
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

@app.put("/admin/products/{product_id}")
def admin_update_product(product_id: int, product: ProductCreate, db: Session = Depends(get_db)):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    for k, v in product.dict().items():
        setattr(db_product, k, v)
    db.commit()
    db.refresh(db_product)
    return db_product

@app.delete("/admin/products/{product_id}")
def admin_delete_product(product_id: int, db: Session = Depends(get_db)):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(db_product)
    db.commit()
    return {"status": "success"}

# ─── Admin: Orders ───────────────────────────────────────────────────────────
@app.get("/admin/orders")
def admin_get_orders(db: Session = Depends(get_db)):
    orders = db.query(models.Order).order_by(models.Order.id.desc()).all()
    result = []
    for o in orders:
        product = db.query(models.Product).filter(models.Product.id == o.product_id).first()
        result.append({
            "id": o.id,
            "product_name": product.name if product else "Deleted",
            "price_eth": product.price_eth if product else 0,
            "user_email": o.user_email,
            "customer_address": o.customer_address,
            "status": o.status,
            "tx_hash": o.tx_hash,
            "failure_reason": o.failure_reason
        })
    return result

