# Nearest-Library-Finder

[English](./README_EN.md)

책 제목으로 검색해서 원하는 책을 고르면, 해당 책을 대출할 수 있는 도서관을 지도에 표시하고 현재 위치에서 가장 가까운 도서관을 알려주는 웹 서비스

2021년 2분기 개발 (인터넷웹기초 수업 텀 프로젝트)

## 기능

- 책 제목으로 검색
- 대출 가능한 도서관 지도에 마커로 표시
- 현재 위치 기준 가장 가까운 도서관 출력
- 부산 지역 한정 (소스코드 수정 시 전국으로 확장 가능)

## 스크린샷

![스크린샷](https://github.com/Neibce/Nearest-Library-Finder/assets/18096595/ca288cfe-b8c7-4818-87c2-db1d4f481696)

## 사용 기술

- Node.js (Express)
- KolisNet API (국립중앙도서관)
- Kakao Map API

## 실행 방법

```bash
git clone https://github.com/Neibce/Nearest-Library-Finder.git
cd Nearest-Library-Finder
npm install
node index.js
```
