```mermaid
sequenceDiagram
actor User as 유저
participant Server as 서버
participant DB as DB

User->>Server: 상품 정보 요청<br/>(productId)
activate Server

Server->>DB: 상품 조회<br/>(productId)
activate DB
DB-->>Server: 상품 정보 응답<br/>(productWithOptions)
deactivate DB

Server-->>User: 상품 정보 응답<br/>(productInfoDTO)
deactivate Server
```
