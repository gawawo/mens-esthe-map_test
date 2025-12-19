FROM postgis/postgis:16-3.4

# Install pgvector extension with LLVM 13 (required by pg_config)
RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    postgresql-server-dev-16 \
    clang-13 \
    llvm-13 \
    && rm -rf /var/lib/apt/lists/*

RUN cd /tmp && \
    git clone --branch v0.7.4 https://github.com/pgvector/pgvector.git && \
    cd pgvector && \
    make && \
    make install && \
    rm -rf /tmp/pgvector
