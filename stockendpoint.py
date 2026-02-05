from fastapi import FastAPI, Query, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, desc, asc
from sqlalchemy.orm import sessionmaker
from models import Stock, Fundamental, SessionLocal, PriceHistory
import math
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def clean_nans(data: Any) -> Any:
    if isinstance(data, float):
        if math.isnan(data) or math.isinf(data):
            return None
        return data
    elif isinstance(data, dict):
        return {k: clean_nans(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [clean_nans(v) for v in data]
    elif hasattr(data, "__dict__"):
        return clean_nans(data.__dict__)
    return data

@app.get("/")
def read_root():
    return RedirectResponse(url="/docs")

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "StockAg API is running"}

@app.get("/api/fundamentals")
def get_fundamentals(
    min_market_cap: float = Query(None),
    max_market_cap: float = Query(None),
    min_pe: float = Query(None),
    max_pe: float = Query(None),
    min_growth: float = Query(None, alias="min_revenue_growth"),
    max_growth: float = Query(None, alias="max_revenue_growth"),
    min_profit_margin: float = Query(None),
    max_profit_margin: float = Query(None),
    min_perf_1y: float = Query(None),
    max_perf_1y: float = Query(None),
    fcf_positive: bool = Query(None),
    analyst_rating: str = Query(None),
    ticker_search: str = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    sort_by: str = Query("market_cap"),
    sort_order: str = Query("desc"),
    db: Session = Depends(get_db)
):
    query = db.query(Fundamental)

    if ticker_search:
        query = query.filter(Fundamental.ticker.ilike(f"%{ticker_search}%"))
        
    if min_market_cap is not None:
        query = query.filter(Fundamental.market_cap >= min_market_cap)
    if max_market_cap is not None:
        query = query.filter(Fundamental.market_cap <= max_market_cap)
        
    if min_pe is not None:
        query = query.filter(Fundamental.pe_ttm >= min_pe)
    if max_pe is not None:
        query = query.filter(Fundamental.pe_ttm <= max_pe)
        
    if min_growth is not None:
        query = query.filter(Fundamental.revenue_growth_yoy >= min_growth)
    if max_growth is not None:
        query = query.filter(Fundamental.revenue_growth_yoy <= max_growth)
        
    if min_profit_margin is not None:
        query = query.filter(Fundamental.profit_margin >= min_profit_margin)
    if max_profit_margin is not None:
        query = query.filter(Fundamental.profit_margin <= max_profit_margin)

    if min_perf_1y is not None:
        query = query.filter(Fundamental.perf_1y >= min_perf_1y)
    if max_perf_1y is not None:
        query = query.filter(Fundamental.perf_1y <= max_perf_1y)

    if fcf_positive is not None:
        query = query.filter(Fundamental.free_cash_flow_positive == fcf_positive)

    if analyst_rating:
        query = query.filter(Fundamental.analyst_rating.ilike(f"%{analyst_rating}%"))

    if hasattr(Fundamental, sort_by):
        col_attr = getattr(Fundamental, sort_by)
        if sort_order == "asc":
            query = query.order_by(asc(col_attr))
        else:
            query = query.order_by(desc(col_attr))
    else:
        query = query.order_by(desc(Fundamental.market_cap))

    total_records = query.count()
    
    offset = (page - 1) * limit
    results = query.offset(offset).limit(limit).all()

    data_clean = []
    for r in results:
        r_dict = {k: v for k, v in r.__dict__.items() if not k.startswith('_sa_')}
        data_clean.append(clean_nans(r_dict))

    return {
        "data": data_clean,
        "pagination": {
            "total": total_records,
            "page": page,
            "limit": limit,
            "total_pages": math.ceil(total_records / limit)
        }
    }

@app.get("/api/stock/{ticker}")
def get_stock_detail(ticker: str, db: Session = Depends(get_db)):
   
    item = db.query(Fundamental).filter(Fundamental.ticker == ticker.upper()).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Stock not found")
    
    item_dict = {k: v for k, v in item.__dict__.items() if not k.startswith('_sa_')}
    
    if item.stock:
        item_dict['company_name'] = item.stock.company_name
        
    return clean_nans(item_dict)

@app.get("/api/stocks")
def get_all_tickers(db: Session = Depends(get_db)):
   
    stocks = db.query(Stock.ticker, Stock.company_name).all()
    return [{"ticker": s.ticker, "name": s.company_name} for s in stocks]

@app.get("/api/stock/{ticker}/price-history")
def get_price_history(ticker: str, period: str = Query("1Y"), db: Session = Depends(get_db)):
    end_date = datetime.now().date()
    
    period_mapping = {
        "5D": timedelta(days=5),
        "1M": timedelta(days=30),
        "6M": timedelta(days=180),
        "1Y": timedelta(days=365),
        "5Y": timedelta(days=365 * 5)
    }
    
    delta = period_mapping.get(period.upper(), timedelta(days=365))
    start_date = end_date - delta
    
    price_data = db.query(PriceHistory).filter(
        PriceHistory.ticker == ticker.upper(),
        PriceHistory.date >= start_date
    ).order_by(PriceHistory.date).all()
    
    if not price_data:
        raise HTTPException(status_code=404, detail="No price history found for this stock")
    
    result = []
    for item in price_data:
        result.append({
            'date': item.date.isoformat(),
            'open': item.open_price,
            'high': item.high_price,
            'low': item.low_price,
            'close': item.close_price,
            'volume': item.volume
        })
    
    return clean_nans(result)