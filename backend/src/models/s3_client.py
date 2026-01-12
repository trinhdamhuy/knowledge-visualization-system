"""Supabase configuration for loading files."""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()
url: str = os.environ.get("SUPABASE_URL")
if not url:
    raise ValueError("SUPABASE_URL must be set")
key: str = os.environ.get("SUPABASE_KEY")
if not key:
    raise ValueError("SUPABASE_KEY must be set")

_s3_client: Client = create_client(
    url,
    key,
)


def get_s3_client() -> Client:
    """Get the supabase client."""
    return _s3_client
