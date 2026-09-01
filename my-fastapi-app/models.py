from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"
    email = Column(String, primary_key=True, index=True)
    name = Column(String)
    password_hash = Column(String)
    avatar_url = Column(String, nullable=True)
    is_admin = Column(Boolean, default=False)

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)
    price_eth = Column(Float)
    image_url = Column(String)
    category = Column(String, default="General")

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    customer_address = Column(String, index=True)
    user_email = Column(String, ForeignKey("users.email"), nullable=True)
    status = Column(String, default="pending") # pending, paid, failed
    tx_hash = Column(String, nullable=True)
    failure_reason = Column(String, nullable=True)

    product = relationship("Product")
    user = relationship("User")
