from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.routes.backtest import router as backtest_router
from backend.api.routes.linkage import router as linkage_router
from backend.api.routes.meta import router as meta_router
from backend.api.routes.news import router as news_router
from backend.api.routes.overview import router as overview_router


def create_app() -> FastAPI:
    app = FastAPI(title="情绪风险预警接口")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
            "http://localhost:5173",
            "http://localhost:5174",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(meta_router)
    app.include_router(overview_router)
    app.include_router(linkage_router)
    app.include_router(news_router)
    app.include_router(backtest_router)
    return app


app = create_app()
