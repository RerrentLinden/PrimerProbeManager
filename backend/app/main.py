from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
import app.models  # noqa: F401 — ensure all models are registered

from app.routers import (
    auth, primers, tubes, usage_logs, boxes, search, import_data, projects, stats,
)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncGenerator[None, None]:
    Path("data").mkdir(exist_ok=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(title="PrimerManager", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(primers.router)
app.include_router(tubes.router)
app.include_router(usage_logs.router)
app.include_router(boxes.router)
app.include_router(search.router)
app.include_router(import_data.router)
app.include_router(projects.router)
app.include_router(stats.router)
