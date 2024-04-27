var map_container = document.getElementById('map');

var currentLocation = new kakao.maps.LatLng(35.2335123, 129.0810047); //부산대학교 좌표. 현재 위치를 가져오기 전까지 표시하기 위함.
var options = {
    center: currentLocation,
    level: 8 //지도 확대, 축소 단계
};

var map = new kakao.maps.Map(map_container, options);

function getCurrentLocation() { //현재 위치를 가져오는 함수
    if (navigator.geolocation)
        navigator.geolocation.getCurrentPosition(currentPositionSuccessCallBack, currentPositionErrorCallBack);
}

function currentPositionErrorCallBack() {
    alert("현재 위치를 가져오지 못했습니다.");
}

function currentPositionSuccessCallBack(position) { //현재 위치를 성공적으로 가져왔을 경우.
    console.log("Latitude: " + position.coords.latitude +
    "Longitude: " + position.coords.longitude);

    currentLocation = new kakao.maps.LatLng(position.coords.latitude, position.coords.longitude)
    map.setCenter(currentLocation); //현재 위치를 지도의 Center로 지정

    var imageSrc = "./marker_current_location.png", //커스텀 Marker 이미지
    imageSize = new kakao.maps.Size(24, 24), //마커 크기
    imageOption = {offset: new kakao.maps.Point(12, 12)}; //마커 중심 좌표

    var markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize, imageOption);

    var marker = new kakao.maps.Marker({
        position: currentLocation, 
        image: markerImage
    });

    marker.setMap(map); //마커 표시
}
getCurrentLocation();

var searchResultList = $("#search-result");

$("input[name=book-name]").on("input", function() { //검색 창의 값이 변경되었을 때.
    searchBooks($(this).val());
});

function getBookListHtml(recKey, book){ //recKey와 book object를 받아 html list 형태로 변환해 줌.
    return "<li onclick=\"showBookDetail(" + recKey + ");\"><p class=\"book-title\">" + book.title + "</p>"
        +"<p class=\"book-info\">" + book.publisher + " / " + book.author + "</p></li>"
}

var searchRequest;
var detailRequest = [];
var bookList = {};
function searchBooks(title){ //책 제목을 통한 책 검색.
    if(searchRequest != undefined)
        searchRequest.abort(); //이전 책 검색 요청을 취소.
    for (var reqest of detailRequest)
        reqest.abort(); //이전 책 보유 도서관 검색 요청을 취소.
    detailRequest = [];

    searchResultList.empty(); //검색 결과 창 비움.
    bookList = {};
    
    if(title == "") //사용자 입력이 아무것도 없을 경우에 대한 예외처리
        return;

    searchResultList.append("<li>검색 중...</li>"); //검색이 진행 중임을 알리기 위함.

    searchRequest = $.get("http://127.0.0.1:3000/book-search?page=1&title=" + encodeURI(title), function(resXML1) { //책 제목을 통한 책 검색 리스트 요청
        console.log(resXML1);
        var records = $(resXML1).find('RECORD');
        if(records.length == 0){
            searchResultList.empty(); //아까 띄웠던 [검색 중...] 표시를 제거하기 위함.
            searchResultList.append("<li>검색결과가 없습니다.</li>") //검색결과가 없다고 알리기 위함.
        }
        var detailRequestNum = 0; //상세정보 요청의 요청 완료 수
        records.each(function(){ //검색된 책 마다,
            var record = $(this);
            var bookRecKey = record.find("REC_KEY").text(); //책 id (rec_key)
            detailRequest.push(
                $.get("http://127.0.0.1:3000/book-detail?rec_key=" + bookRecKey, function(resXML2) { //책을 보유하고 있는 도서관 리스트 요청 (책 상세정보 요청)
                    detailRequestNum += 1;

                    var book = {title: record.find("TITLE").text(), publisher: record.find("PUBLISHER").text(),
                            author: record.find("AUTHOR").text(), libList: []};
                    
                    $(resXML2).find('HOLDINFO').each(function(){ //보유 도서관 리스트 중 도서관 지역이 부산인 것만 추출.
                        var local = $(this).find('LOCAL').text();
                        if(local == "부산" || local == "부산광역시")
                            book.libList[$(this).find("LIB_NAME").text()] = {callNo: $(this).find("CALL_NO").text()};
                    });
                    if(Object.keys(book.libList).length > 0){ //부산시 내의 도서관이 책을 보유중일 경우.
                        if(Object.keys(bookList).length == 0) //첫번째로 찾은 책일 경우
                            searchResultList.empty(); //아까 띄웠던 [검색 중...] 표시를 제거하기 위함.

                        bookList[bookRecKey] = book; //bookList에 추가.
                        searchResultList.append(getBookListHtml(bookRecKey, book)); //검색 결과에 띄움.
                    }
                    console.log(resXML2);
                    
                    if(detailRequestNum == records.length && bookList.length == 0) //모든 상세정보의 요청이 완료되었으나, bookList가 비었을경우. (책 검색 결과는 있으나 부산시 내에 보유한 도서관이 없을 경우.)
                        searchResultList.append("<li>검색결과가 없습니다.<li>");
            },"xml"));
        });
    },"xml");
}

var libraryList = [];
var bounds = new kakao.maps.LatLngBounds(); //지도에 모든 도서관 마커를 보이게 하기 위해 사용

var recommend = $("#recommend");
var recommandBookName = $("#recommend-book-name");
function showBookDetail(recKey){ //검색 결과에서 책을 선택(클릭)했을 경우
    recommend.css("display", "block"); //감춰져있던 추천 도서관 div를 보이게 함.
    recommandBookName.html(bookList[recKey].title); //추천 도서관 div 내의 책 제목 설정
    
    console.log(bookList);
    libraryList = [];

    bounds = new kakao.maps.LatLngBounds(); //이전에 들어있던 도서관 좌표값 제거
    bounds.extend(currentLocation); //현재 위치 추가 (현재 위치도 지도에 보여야 하므로.)
    removeMarkers(); //이전에 있던 마커 제거.
    
    for(var libName in bookList[recKey].libList){ //책의 보유 도서관명 리스트를 돌면서,
        requestLibraryLatLng(recKey, libName); //도서관의 좌표(lat,lng)를 요청.
    }
}

var ps = new kakao.maps.services.Places(); 
function requestLibraryLatLng(bookRecKey, libraryName){ //도서관의 좌표(lat,lng)를 요청.
    ps.keywordSearch(libraryName, function(data, status, pagination){ //카카오 맵 API를 통한 keywordSearch
        if (status === kakao.maps.services.Status.OK) { //성공적으로 가져온 경우.
            console.log(libraryName)
            console.log(data)
            displayMarker(bookRecKey, libraryName, data[0]); //도서관 위치 마커 표시

            bounds.extend(new kakao.maps.LatLng(data[0].y, data[0].x)); //bounds에 추가. 
            map.setBounds(bounds); //지도에 bounds내의 것들이 한번에 보이게 설정.
            map.setLevel(map.getLevel() + 1); //지도 현재 크기에서 1번 축소.
        } 
    }, {size:1, location: currentLocation});
}

var markerAndIWs = [];
function removeMarkers(){ //모든 마커 제거
    for (var markerAndIW of markerAndIWs) {
        markerAndIW[0].setMap(null);
        markerAndIW[1].setMap(null);
    } 
    markerList = [];
}

var libraryRecommend = $("#library-recommend");
var callNo = $("#call-no");
var distance = $("#distance");
var getDirections = $("#get-directions");
function displayMarker(bookRecKey, libraryName, place) { //도서관 마커를 표시해주는 함수
    var marker = new kakao.maps.Marker({
        map: map,
        position: new kakao.maps.LatLng(place.y, place.x) 
    });

    var currentLibrary = {};
    currentLibrary.realName = place.place_name; //실제 지도에 표시된 도서관명
    currentLibrary.callNo = bookList[bookRecKey].libList[libraryName].callNo; //도서관 내 책의 위치
    currentLibrary.distance = (place.distance / 1000).toFixed(2); //거리 변환 (km -> m)
    currentLibrary.directionURL = "https://map.kakao.com/link/to/" + place.place_name + "," + place.y + "," + place.x; //길찾기 URL 생성 (카카오맵 바로가기)

    libraryList.push(currentLibrary);

    console.log(libraryList);
    libraryList.sort(function(a, b) { //거리순으로 도서관 리스트를 정렬.
        return a.distance - b.distance;
    });
    //추천 도서관을 표시하는 부분. libraryList[0] = 가장 가까운 도서관
    libraryRecommend.text(libraryList[0].realName);
    callNo.text(libraryList[0].callNo);
    distance.text(libraryList[0].distance + "km");
    getDirections.attr("href", libraryList[0].directionURL);

    //marker와 함께 infowindow도 띄움.
    var infowindow = new kakao.maps.InfoWindow({
        position : place,
        content : "<div style=\"white-space: nowrap;padding:5px;font-size:13px;\">" + currentLibrary.realName
                + "<br>도서 위치: " + currentLibrary.callNo
                + "<br>거리: " + currentLibrary.distance + "km"
                + "<br><a href=\"" + currentLibrary.directionURL + "\" target=\"_blank\">길찾기</a></div>"
    });
    infowindow.open(map, marker);

    markerAndIWs.push([marker, infowindow]);
}