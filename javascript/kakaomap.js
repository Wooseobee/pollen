var mapContainer = document.getElementById('map'), // 지도를 표시할 div
    mapOption = {
        center: new kakao.maps.LatLng(33.450701, 126.570667), // 지도의 중심좌표
        level: 3 // 지도의 확대 레벨
    };

// 지도를 생성합니다
var map = new kakao.maps.Map(mapContainer, mapOption);

// 주소-좌표 변환 객체를 생성합니다
var geocoder = new kakao.maps.services.Geocoder();

var coords = null;

var place = null;

var markers = []; // 마커 전체적으로 통제

var infoWindows = [];    // infoWindow 전체적으로 통제

var latlng = null;

var city = null;    // 시 단위로 지점 검색

var gu = null;    // 구 단위로 지점 검색

var code = null;    // 지점 코드

var type = 0; // 참나무=1, 소나무=2, 잡초류=3

$('#submit').click(function () {

    var date = new Date();  // 현재 시간 설정
    var todayDate = date.toISOString().substring(0, 10).replace(/-/g, '');
    var today;
    var tomorrow;
    var dayaftertomorrow;
    var yesterday = 0;  // 어제면 1 오늘이면 0

    // UTC 기준과 시차가 9시간이므로 우리나라 시간 09시가 지나야 우리나라 날짜와 UTC 날짜가 같아짐
    if (date.getHours() < 9) {
        todayDate += '18';
        yesterday = 1;  // 어제 18시 데이터
    } else if (date.getHours() >= 9 && date.getHours() <= 23) {
        todayDate += '06';
        yesterday = 0;  // 오늘 06시 데이터
    }

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

    // 주소로 좌표를 검색합니다
    geocoder.addressSearch($('#address').val(), function (result, status) {

        // 정상적으로 검색이 완료됐으면
        if (status === kakao.maps.services.Status.OK) {
            coords = new kakao.maps.LatLng(result[0].y, result[0].x);

            let lat = result[0].y;
            let lng = result[0].x;
            getAddr(lat, lng);   // 추출한 좌표를 통해 도로명 주소 추출

            // 결과값으로 받은 위치를 마커로 표시합니다
            var marker = new kakao.maps.Marker({
                map: map,
                position: coords
            });

            // 인포윈도우로 장소에 대한 설명을 표시합니다
            var infowindow = new kakao.maps.InfoWindow({
                content: '<div id="place" style="height: 30px;width:150px;padding:6px 0;">'+ '<img src="./images/Best.png" style="height: 30px; padding: 0 6px 0 6px">' + $('#address').val() + '</div>'
            });
            marker.setMap(map);
            markers.push(marker);   // 생성된 마커를 배열에 추가

            infowindow.open(map, marker);
            infoWindows.push(infowindow);   // 생성된 infoWindow 배열에 추가

            // 지도의 중심을 결과값으로 받은 위치로 이동시킵니다
            map.setCenter(coords);
        } else {
            // 장소 검색 객체를 생성합니다
            var ps = new kakao.maps.services.Places();

            // 키워드로 장소를 검색합니다
            ps.keywordSearch($('#address').val(), placesSearchCB);

            // 키워드 검색 완료 시 호출되는 콜백함수 입니다
            function placesSearchCB(data, status, pagination) {
                if (status === kakao.maps.services.Status.OK) {

                    place = new kakao.maps.LatLng(data[0].y, data[0].x);

                    getAddr(data[0].y, data[0].x);

                    // 검색된 장소 위치를 기준으로 지도 범위를 재설정하기위해
                    // LatLngBounds 객체에 좌표를 추가합니다
                    var bounds = new kakao.maps.LatLngBounds();

                    displayMarker(data[0]);
                    bounds.extend(new kakao.maps.LatLng(data[0].y, data[0].x));

                    // 검색된 장소 위치를 기준으로 지도 범위를 재설정합니다
                    map.setBounds(bounds);
                    // console.log(data);
                }
            }

            // 지도에 마커를 표시하는 함수입니다
            function displayMarker(place) {

                // 마커를 생성하고 지도에 표시합니다
                var marker = new kakao.maps.Marker({
                    map: map,
                    position: new kakao.maps.LatLng(place.y, place.x)
                });

                // 인포윈도우로 장소에 대한 설명을 표시합니다
                var infowindow = new kakao.maps.InfoWindow({
                    content: '<div id="place1" style="height: 30px;width:150px; padding:6px 0;">' + '<img src="./images/Best.png" style="height: 30px; padding: 0 6px 0 6px">' + place.place_name + '</div>'
                });
                marker.setMap(map);
                markers.push(marker);   // 생성된 마커를 배열에 추가
                latlng = marker.getPosition();

                infowindow.open(map, marker);
                infoWindows.push(infowindow);   // 생성된 infoWindow 배열에 추가
            }
        }

        function getAddr(lat, lng) {
            let geocoder = new kakao.maps.services.Geocoder();

            let coord = new kakao.maps.LatLng(lat, lng);
            let callback = function (result, status) {
                if (status === kakao.maps.services.Status.OK) {
                    let str;
                    if (result[0].road_address == null) {      // 도로명 주소 유무
                        str = result[0].address.address_name;
                        gu = result[0].address.region_2depth_name;
                    } else {
                        str = result[0].road_address.address_name;
                        gu = result[0].road_address.region_2depth_name;
                    }
                    city = str.split(' ', 1)[0];
                    if (city == '서울')
                        city += '특별시';
                    if (parseInt(todayDate.substring(4, 6)) >= 4 && parseInt(todayDate.substring(4, 6)) <= 6) {
                        var url = 'https://secret-hollows-44914.herokuapp.com/http://apis.data.go.kr/1360000/HealthWthrIdxServiceV2/getOakPollenRiskIdxV2';          // 참나무 요청 URL
                        type = 1;
                        requestData(url);
                    }
                    if (parseInt(todayDate.substring(4, 6)) >= 4 && parseInt(todayDate.substring(4, 6)) <= 6) {
                        var url = 'https://secret-hollows-44914.herokuapp.com/http://apis.data.go.kr/1360000/HealthWthrIdxServiceV2/getPinePollenRiskIdxV2';          // 소나무 요청 URL
                        type = 2;
                        requestData(url);
                    }
                    if (parseInt(todayDate.substring(4, 6)) >= 8 && parseInt(todayDate.substring(4, 6)) <= 10) {
                        var url = 'https://secret-hollows-44914.herokuapp.com/http://apis.data.go.kr/1360000/HealthWthrIdxServiceV2/getWeedsPollenRiskndxV2';       // 잡초류 요청 URL
                        type = 3;
                        requestData(url);
                    }
                }
            }
            geocoder.coord2Address(coord.getLng(), coord.getLat(), callback);
        }

        function requestData(url) {
            for (let index = 0; index < area.length; index++) {
                const depth1 = area[index]['1단계'];
                const depth2 = area[index]['2단계'];
                if (depth1 == city && depth2 == gu) {
                    code = area[index]['행정구역코드'];
                }
            }

            var xhr = new XMLHttpRequest();
            var url = url;
            var queryParams = '?' + encodeURIComponent('serviceKey') + '=' + 'h9LeXhaL6HnBJDW%2BmFYwoaQzexQrSgGK%2BjpLUNe%2BJwcD%2FhpbdvzrgkdmsQYh7wxno25wIg6jaFWaSzZP1S4TIQ%3D%3D'; /*Service Key*/
            queryParams += '&' + encodeURIComponent('pageNo') + '=' + encodeURIComponent('1'); /*페이지번호*/
            queryParams += '&' + encodeURIComponent('numOfRows') + '=' + encodeURIComponent('10'); /*한 페이지 결과 수*/
            queryParams += '&' + encodeURIComponent('dataType') + '=' + encodeURIComponent('JSON'); /*요청자료형식(XML/JSON)*/
            queryParams += '&' + encodeURIComponent('areaNo') + '=' + encodeURIComponent(code); /*지점코드*/
            queryParams += '&' + encodeURIComponent('time') + '=' + encodeURIComponent(todayDate); /*오늘 날짜*/

            xhr.open('GET', url + queryParams);
            xhr.send();
            if (type == 1 || type == 2) {
                $("#table tr:eq(3) td:eq(1)").html("제공기간 X");
                $("#table tr:eq(3) td:eq(2)").html("제공기간 X");
                $("#table tr:eq(3) td:eq(3)").html("제공기간 X");
            } else {
                $("#table tr:eq(1) td:eq(1)").html("제공기간 X");
                $("#table tr:eq(1) td:eq(2)").html("제공기간 X");
                $("#table tr:eq(1) td:eq(3)").html("제공기간 X");
                $("#table tr:eq(2) td:eq(1)").html("제공기간 X");
                $("#table tr:eq(2) td:eq(2)").html("제공기간 X");
                $("#table tr:eq(2) td:eq(3)").html("제공기간 X");
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

                    if (yesterday == 0) {
                        if (type == 1) {    // 참나무 데이터 설정
                            $("#table tr:eq(1) td:eq(1)").html(today);
                            $("#table tr:eq(1) td:eq(2)").html(tomorrow);
                            $("#table tr:eq(1) td:eq(3)").html(dayaftertomorrow);
                        } else if (type == 2) {    // 소나무 데이터 설정
                            $("#table tr:eq(2) td:eq(1)").html(today);
                            $("#table tr:eq(2) td:eq(2)").html(tomorrow);
                            $("#table tr:eq(2) td:eq(3)").html(dayaftertomorrow);
                        } else if (type == 3) {    // 잡초류 데이터 설정
                            $("#table tr:eq(3) td:eq(1)").html(today);
                            $("#table tr:eq(3) td:eq(2)").html(tomorrow);
                            $("#table tr:eq(3) td:eq(3)").html(dayaftertomorrow);
                        }
                    } else {
                        if (type == 1) {    // 참나무 데이터 설정
                            $("#table tr:eq(1) td:eq(1)").html(tomorrow);
                            $("#table tr:eq(1) td:eq(2)").html(dayaftertomorrow);
                            $("#table tr:eq(1) td:eq(3)").html(twodaysaftertomorrow);
                        } else if (type == 2) {    // 소나무 데이터 설정
                            $("#table tr:eq(2) td:eq(1)").html(tomorrow);
                            $("#table tr:eq(2) td:eq(2)").html(dayaftertomorrow);
                            $("#table tr:eq(2) td:eq(3)").html(twodaysaftertomorrow);
                        } else if (type == 3) {    // 잡초류 데이터 설정
                            $("#table tr:eq(3) td:eq(1)").html(tomorrow);
                            $("#table tr:eq(3) td:eq(2)").html(dayaftertomorrow);
                            $("#table tr:eq(3) td:eq(3)").html(twodaysaftertomorrow);
                        }
                    }
                }
            };
        }

        document.getElementById('address').value = null;    // 주소 검색 창 리셋
    });
});