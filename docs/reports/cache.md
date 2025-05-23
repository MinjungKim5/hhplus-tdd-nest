# 캐시 적용 보고서

## 문제 인식
- 쇼핑몰 서비스의 조회 쿼리 중 인기상품순 조회는 3일간 상품의 판매량을 집계하여 판매순으로 정렬한 순서로 상품 목록을 조회해야 한다.
- 단순히 id나 다른 키 값으로 조회해서 결과를 보거나 조인하여 정보를 조회하는 쿼리보다 각각 row에 대해서 계산하고 정렬해야 하므로 상품의 가지수나 구매량이 늘어날 수록 쿼리 속도가 느려질 수 있다.
- 조회 속도를 높이기 위해 매번 purchase 내역에서 판매량을 집계하는 대신 상품의 일간 판매량테이블을 만들고 3일간의 데이터를 합산하도록 db구조와 쿼리를 설계했으나 이 또한 모든 구매 내역을 조회하지 않을 뿐이지 합산, 정렬은 그대로 남아있어 상품 수가 많을수록 느려질 가능성이 있다.
- 만약 조회 결과 자체를 저장해놓고 반복되는 같은 요청에는 저장된 값을 반환한다면 조회속도를 높일 수 있을 것이다.

## 문제 해결
- 위 쿼리의 속도를 높이고 db의 부하를 줄이기 위해 캐시를 사용하였다.
- 최근 3일간 판매량은 3일 전부터 어제까지를 기준으로 하므로 인기상품순 조회결과는 하루에 한번 바뀔 수 있다.
- 따라서 캐시 수명을 24시간으로 잡고, 매일 방 12시에 Cron작업으로 조회 메소드를 한번 돌려 캐시를 리프레시하는 전략을 사용하였다.

## 검증
- 테스트코드에서 인기상품 조회를 두번 진행하고 첫번째 조회(캐시 미스)와 두번쨰 조회(캐시 히트)에 걸리는 시간을 비교하였다.
- 테스트 데이터는 상품 1000개에 1에서 100까지 일일 구매량을 무작위로 부여하였다.
- 테스트 컨테이너를 띄워 테스트한 결과 첫번쨰는 7 ms, 두번쨰는 2 ms가 나와 캐시 적용 시에 조회속도가 더 빠르다는 것을 알 수 있었다.
- 데이터세트를 만들기 전 상품이 2개일 경우로 테스트해보았을 때에도 3 ms, 0 ms로 캐시 히트시에 기본적으로 응답속도가 빠를뿐더러 데이터가 커지면서 소요시간이 증가하는 추이도 더 낮았다.
- 만약 캐시 서버는 클러스터 내부에, db는 외부 클러스터에 있는 환경이라면 네트워크속도나 락 적용 등에 의해 속도 차이가 더 극명해질 것으로 예상된다.

## 대안
- Cron 작업일 경우 캐시를 강제로 삭제한 뒤 리프레시하는 방식을 적용한다면 정확한 시간에 캐시에 적재할 수 있게 개선이 가능할 것이다.