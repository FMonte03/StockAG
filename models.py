from sqlalchemy import create_engine, Column, String, Integer, Float, Date, Boolean, ForeignKey
from sqlalchemy.orm import declarative_base, relationship, sessionmaker

import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set in the environment variables.")

engine = create_engine(DATABASE_URL, echo=True)
Base = declarative_base()
SessionLocal = sessionmaker(bind=engine)

class Stock(Base):
    __tablename__ = "stock"

    ticker = Column(String(10), primary_key=True)
    company_name = Column(String(255))
    fundamentals = relationship("Fundamental", back_populates="stock", cascade="all, delete-orphan")
    price_history = relationship("PriceHistory", back_populates="stock", cascade="all, delete-orphan")


class Fundamental(Base):
    __tablename__ = "fundamentals"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ticker = Column(String(10), ForeignKey("stock.ticker", ondelete="CASCADE"))
    snapshot_date = Column(Date, nullable=False)

    revenue_growth_yoy = Column(Float)
    debt_to_equity = Column(Float)
    interest_coverage = Column(Float)
    free_cash_flow_positive = Column(Boolean)
    roe = Column(Float)
    profit_margin = Column(Float)
    current_ratio = Column(Float)
    eps_ttm = Column(Float)
    pe_ttm = Column(Float)
    analyst_rating = Column(String(50))
    peg_5y = Column(Float)
    week_range_52 = Column(String(50))
    day_range = Column(String(50))
    current_price = Column(Float)
    perf_1y = Column(Float)
    beta = Column(Float)
    pe_trailing = Column(Float)
    market_cap = Column(Float)

    stock = relationship("Stock", back_populates="fundamentals")


class PriceHistory(Base):
    __tablename__ = "price_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ticker = Column(String(10), ForeignKey("stock.ticker", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False)
    open_price = Column(Float)
    high_price = Column(Float)
    low_price = Column(Float)
    close_price = Column(Float)
    volume = Column(Float)

    stock = relationship("Stock", back_populates="price_history")