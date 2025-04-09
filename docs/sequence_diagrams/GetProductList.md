```mermaid
sequenceDiagram
actor User as 유저
participant Server as 서버
participant DB as DB

User->>Server: 상품 리스트 요청<br/>(조건)
activate Server

Server->>DB: 상품 조회<br/>(검색조건)
activate DB
DB-->>Server: 상품 리스트 응답<br/>(products)
deactivate DB

Server-->>User: 상품 리스트 응답<br/>(productsDTO)
deactivate Server
```
