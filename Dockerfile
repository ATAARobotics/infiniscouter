##############################
# Build Rust portion
##############################

FROM docker.io/rustlang/rust:nightly AS build-rust
WORKDIR /build

COPY server/games /build/games
COPY server/src /build/src
COPY server/Cargo.toml /build/Cargo.toml
COPY server/Cargo.lock /build/Cargo.lock

ARG CARGO_UNSTABLE_SPARSE_REGISTRY=true

# run tests which also generate JSON types in TypeScript
RUN cargo test --locked --profile release

RUN cargo build --locked --profile release
RUN chmod -R u=rwX,go=rX /build/target/release

# create user while we have adduser tool
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/nonexistent" \
    --shell "/sbin/nologin" \
    --no-create-home \
    --uid "4421" \
    "forge"

# create application folder and ensure it has the correct permissions
COPY server/team_config.yaml /app/team_config.yaml
COPY server/team_config.yaml /app/team_config_template.yaml
RUN mkdir -p /app/data
RUN chown -R forge:forge /app
RUN chmod -R u=rwX,go=rX /app


##############################
# Build Node.js portion
##############################

FROM docker.io/library/node:18-alpine as build-node

WORKDIR /build

COPY client/package.json /build/package.json
COPY client/package-lock.json /build/package-lock.json

RUN npm install

COPY client/tsconfig.json /build/tsconfig.json
COPY client/assets /build/assets
COPY client/src /build/src

# copy generated JSON types from Rust build
COPY --from=build-rust /client/src/generated /build/src/generated

RUN npm run build

# copy passwd and group to get forge user and group
COPY --from=build-rust /etc/passwd /etc/passwd
COPY --from=build-rust /etc/group /etc/group

RUN chown -R forge:forge /build/assets
RUN chown -R forge:forge /build/dist
RUN chmod -R u=rwX,go=rX /build/assets
RUN chmod -R u=rwX,go=rX /build/dist


##############################
# Create minimal container
##############################

FROM gcr.io/distroless/cc-debian12

# copy passwd and group to get forge user and group
COPY --from=build-rust /etc/passwd /etc/passwd
COPY --from=build-rust /etc/group /etc/group

WORKDIR /app

COPY --from=build-rust /app /app
COPY --from=build-rust /build/target/release/infiniscouter-server /app/infiniscouter-server

COPY --from=build-node /build/assets /client/assets
COPY --from=build-node /build/dist /client/dist

VOLUME /app/data

EXPOSE 4421

USER forge:forge

ENTRYPOINT ["/app/infiniscouter-server"]
