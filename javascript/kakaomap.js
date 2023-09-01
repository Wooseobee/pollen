var mapContainer = document.getElementById('map'), // 지도를 표시할 div
    mapOption = {
        center: new kakao.maps.LatLng(36.34, 127.5), // 지도의 중심좌표
        level: 12 // 지도의 확대 레벨
    };

// 지도를 생성합니다
var map = new kakao.maps.Map(mapContainer, mapOption);
map.setMaxLevel(13);

// 주소-좌표 변환 객체를 생성합니다
var geocoder = new kakao.maps.services.Geocoder();

var coords = null;

var markers = []; // 마커 전체적으로 통제

var infoWindows = [];    // infoWindow 전체적으로 통제

var latlng = null;

var city = null;    // 시 단위로 지점 검색

var gu = null;    // 구 단위로 지점 검색

var code = null;    // 지점 코드

var date = null;

var todayDate = null;

var today = null

var tomorrow = null

var dayaftertomorrow = null;

var yesterday = 0;  // 어제면 1 오늘이면 0

var name = null;

var max = -1;

$('#submit').click(submitData);
document.getElementById('address').addEventListener('keypress', event => eventHandler(event));

function eventHandler(event) {
    let key = event.key || event.keyCode;
    if (key == 'Enter' || key === 13) {
        submitData();
    }
}

// HTML5의 geolocation으로 사용할 수 있는지 확인합니다
if (navigator.geolocation) {
    setDate();

    resetMap();

    // GeoLocation을 이용해서 접속 위치를 얻어옵니다
    navigator.geolocation.getCurrentPosition(function (position) {
        var lat = position.coords.latitude, // 위도
            lng = position.coords.longitude; // 경도
        coords = new kakao.maps.LatLng(lat, lng);
        geocoder.coord2Address(lng, lat, callback);
    });
}

function setDate () {
    date = new Date();  // 현재 시간 설정
    todayDate = date.toISOString().substring(0, 10).replace(/-/g, '');

    if (date.getHours() < 6) {  // 06시 이전
        todayDate += '18';
        yesterday = 1;  // 어제 18시 데이터
    } else {    // 06시 이후
        todayDate += '06';
        yesterday = 0;  // 오늘 06시 데이터
    }
}

function resetMap() {
    // 기존의 마커 제거
    if (markers.length != 0) {
        for (var i = 0; i < markers.length; i++) {
            markers[i].setMap(null);
        }
    }

    // 기존의 infoWindow 제거
    if (infoWindows.length != 0) {
        for (var i = 0; i < infoWindows.length; i++) {
            infoWindows[i].close();
        }
    }
}

function submitData () {
    setDate();

    resetMap();

    // 주소로 좌표를 검색합니다
    geocoder.addressSearch($('#address').val(), function (result, status) {
        // 정상적으로 검색이 완료됐으면
        if (status === kakao.maps.services.Status.OK) {
            coords = new kakao.maps.LatLng(result[0].y, result[0].x);

            let lat = result[0].y;
            let lng = result[0].x;

            getAddr(lat, lng);   // 추출한 좌표를 통해 도로명 주소 추출

        } else {
            // 장소 검색 객체를 생성합니다
            var ps = new kakao.maps.services.Places();

            // 키워드로 장소를 검색합니다
            ps.keywordSearch($('#address').val(), placesSearchCB);
        }

        document.getElementById('address').value = null;    // 주소 검색 창 리셋
    });
}

// 키워드 검색 완료 시 호출되는 콜백함수 입니다
function placesSearchCB(data, status) {
    if (status === kakao.maps.services.Status.OK) {

        coords = new kakao.maps.LatLng(data[0].y, data[0].x);

        getAddr(data[0].y, data[0].x);

        // 검색된 장소 위치를 기준으로 지도 범위를 재설정하기위해
        // LatLngBounds 객체에 좌표를 추가합니다
        var bounds = new kakao.maps.LatLngBounds();
        bounds.extend(new kakao.maps.LatLng(data[0].y, data[0].x));
        // 검색된 장소 위치를 기준으로 지도 범위를 재설정합니다
        map.setBounds(bounds);
    }
}

// 지도에 마커를 표시하는 함수입니다
function displayMarker(place, lat, lng) {
    // 마커를 생성하고 지도에 표시합니다
    var marker = new kakao.maps.Marker({
        map: map,
        position: new kakao.maps.LatLng(lat, lng)
    });

    // 인포윈도우로 장소에 대한 설명을 표시합니다
    var infowindow = new kakao.maps.InfoWindow({
        content: '<div id="infoWindow" style="position: relative; display: flex; align-items: center;border-radius: 4px;height: 60px;width:200px; padding:14px 10px;box-shadow: 0 0 3px 3px darkgray; background-color: darkgray">'
            + '<img id="icon" src="./images/best.png" style="width: 55px; height: 55px;">'
            + '<div id="place" style="display: block;font-size: 13px;text-align: center; color: white; padding: 5px">' + name
            + '<div id="type1" style="display: none;font-size: 13px; text-align: center; color: white">' + '참나무: ' + '<span id="type1Level" style="font-size: 24px"></span>' + '</div>'
            + '<div id="type2" style="display: none;font-size: 13px; text-align: center; color: white">' + '소나무: ' + '<span id="type2Level" style="font-size: 24px"></span>' + '</div>'
            + '<div id="type3" style="display: none;font-size: 13px; text-align: center; color: white">' + '잡초류: ' + '<span id="type3Level" style="font-size: 24px"></span>' + '</div>'
            + '</div>'
            + '</div>'
    });
    marker.setMap(map);
    markers.push(marker);   // 생성된 마커를 배열에 추가
    latlng = marker.getPosition();

    infowindow.open(map, marker);
    infoWindows.push(infowindow);   // 생성된 infoWindow 배열에 추가
    map.setLevel(4, {animate: true});

    // 지도의 중심을 결과값으로 받은 위치로 이동시킵니다
    map.setCenter(coords);
}

function getAddr(lat, lng) {
    let geocoder = new kakao.maps.services.Geocoder();

    let coord = new kakao.maps.LatLng(lat, lng);

    geocoder.coord2Address(coord.getLng(), coord.getLat(), callback);
}

function callback(result, status) {
    if (status === kakao.maps.services.Status.OK) {
        let str;
        if (result[0].road_address == null) {      // 도로명 주소 유무
            str = result[0].address.address_name;
            gu = result[0].address.region_2depth_name;
        } else {
            str = result[0].road_address.address_name;
            gu = result[0].road_address.region_2depth_name;
        }
        name = str;
        displayMarker(result[0], coords.getLat(), coords.getLng());
        city = str.split(' ', 1)[0];
        gu = gu.split(' ').join('');
        if (city == '서울')
            city += '특별시';
        if (parseInt(todayDate.substring(4, 6)) >= 4 && parseInt(todayDate.substring(4, 6)) <= 6) {
            var url = 'https://wooseobee.com/oak';          // 참나무 요청 URL
            requestData(url, 1);
        }
        if (parseInt(todayDate.substring(4, 6)) >= 4 && parseInt(todayDate.substring(4, 6)) <= 6) {
            var url = 'https://wooseobee.com/pine';          // 소나무 요청 URL
            requestData(url, 2);
        }
        if (parseInt(todayDate.substring(4, 6)) >= 8 && parseInt(todayDate.substring(4, 6)) <= 10) {
            var url = 'https://wooseobee.com/weeds';       // 잡초류 요청 URL
            requestData(url, 3);
        }
    }
}

function requestData(url, type) {
    for (let index = 0; index < area.length; index++) {
        const depth1 = area[index]['1단계'];
        const depth2 = area[index]['2단계'];
        if (depth1 == city && depth2 == gu) {
            code = area[index]['행정구역코드'];
        }
    }

    var xhr = new XMLHttpRequest();
    var queryParams = '?' + encodeURIComponent('areaNo') + '=' + encodeURIComponent(code)
    queryParams += '&' + encodeURIComponent('time') + '=' + encodeURIComponent(todayDate); /*오늘 날짜*/

    xhr.open('GET', url + queryParams);
    xhr.send();
    // type : 참나무=1, 소나무=2, 잡초류=3
    if (type == 1 || type == 2) {
        $("#table tr:eq(3) td:eq(1)").html("제공기간 X");
        $("#table tr:eq(3) td:eq(2)").html("제공기간 X");
        $("#table tr:eq(3) td:eq(3)").html("제공기간 X");
        $("#type1").css('display', 'block');
        $("#type2").css('display', 'block');
    } else {
        $("#table tr:eq(1) td:eq(1)").html("제공기간 X");
        $("#table tr:eq(1) td:eq(2)").html("제공기간 X");
        $("#table tr:eq(1) td:eq(3)").html("제공기간 X");
        $("#table tr:eq(2) td:eq(1)").html("제공기간 X");
        $("#table tr:eq(2) td:eq(2)").html("제공기간 X");
        $("#table tr:eq(2) td:eq(3)").html("제공기간 X");
        $("#type3").css('display', 'block');
    }
    xhr.onreadystatechange = function () {
        if (this.readyState == 4) {
            var obj = JSON.parse(this.responseText);
            today = obj.response.body.items.item[0].today;
            tomorrow = obj.response.body.items.item[0].tomorrow;
            dayaftertomorrow = obj.response.body.items.item[0].dayaftertomorrow;
            twodaysaftertomorrow = obj.response.body.items.item[0].twodaysaftertomorrow;

            if (today == "") {
                today = '0';
            }
            if (twodaysaftertomorrow == "") {
                twodaysaftertomorrow = '0';
            }

            var level = null;
            if (type == 1) {     // 참나무 데이터 설정
                if (yesterday == 0) {
                    $("#table tr:eq(1) td:eq(1)").html(today);
                    $("#table tr:eq(1) td:eq(2)").html(tomorrow);
                    $("#table tr:eq(1) td:eq(3)").html(dayaftertomorrow);
                    level = matchingLevel(today);
                } else {
                    $("#table tr:eq(1) td:eq(1)").html(tomorrow);
                    $("#table tr:eq(1) td:eq(2)").html(dayaftertomorrow);
                    $("#table tr:eq(1) td:eq(3)").html(twodaysaftertomorrow);
                    level = matchingLevel(tomorrow);
                }
                $("#type1Level").text(level);
            } else if (type == 2) {    // 소나무 데이터 설정
                if (yesterday == 0) {
                    $("#table tr:eq(2) td:eq(1)").html(today);
                    $("#table tr:eq(2) td:eq(2)").html(tomorrow);
                    $("#table tr:eq(2) td:eq(3)").html(dayaftertomorrow);
                    level = matchingLevel(today);
                } else {
                    $("#table tr:eq(2) td:eq(1)").html(tomorrow);
                    $("#table tr:eq(2) td:eq(2)").html(dayaftertomorrow);
                    $("#table tr:eq(2) td:eq(3)").html(twodaysaftertomorrow);
                    level = matchingLevel(tomorrow);
                }
                $("#type2Level").text(level);
            } else if (type == 3) {    // 잡초류 데이터 설정
                if (yesterday == 0) {
                    $("#table tr:eq(3) td:eq(1)").html(today);
                    $("#table tr:eq(3) td:eq(2)").html(tomorrow);
                    $("#table tr:eq(3) td:eq(3)").html(dayaftertomorrow);
                    level = matchingLevel(today);
                } else {
                    $("#table tr:eq(3) td:eq(1)").html(tomorrow);
                    $("#table tr:eq(3) td:eq(2)").html(dayaftertomorrow);
                    $("#table tr:eq(3) td:eq(3)").html(twodaysaftertomorrow);
                    level = matchingLevel(tomorrow);
                }
                $("#type3Level").text(level);
            }

            if (yesterday == 0 && max < today) {
                max = today;
            } else if (yesterday == 1 && max < tomorrow) {
                max = tomorrow
            }
            var imageSrc = './images/' + matchingImage(max) + '.png';
            $("#icon").attr("src", imageSrc);
            $("#infoWindow").css("background-color", matchingBackGroundColor(max));
            $("#infoWindow").css("box-shadow", "0 0 3px 3px" + matchingBackGroundColor(max));
        }
    };
}

function matchingLevel(level){
    switch (level){
        case '0':
            return '낮음';
        case '1':
            return '보통';
        case '2':
            return '높음';
        case '3':
            return '매우 높음';
    }
}

function matchingImage(level) {
    switch (level) {
        case '0':
            return 'best';
        case '1':
            return 'good';
        case '2':
            return 'bad';
        case '3':
            return 'worst';
    }
}

function matchingBackGroundColor(level){
    switch (level) {
        case '0':
            return '#0978d2';
        case '1':
            return '#f1c349';
        case '2':
            return '#f17d13';
        case '3':
            return '#d21414';
    }
}