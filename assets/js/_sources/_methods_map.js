﻿function initMap(){
    this.map = L.map('mapContainer');
    L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>', maxZoom: 15}).addTo(this.map); 
    this.cluster = L.markerClusterGroup({
        showCoverageOnHover:false,
        iconCreateFunction: function(cluster) {
          return L.divIcon({ html: cluster.getChildCount(), className: "cluster", iconSize: L.point(50, 50), iconAnchor: L.point(25, 46), autoPan: false });
       }
    });
    this.currentBounds = L.latLngBounds();
    this.cities.forEach(function(city){
		 if(!city.isSurvey){
        this.currentBounds.extend(city.bounds);
        this.cluster.addLayer(city.marker);
		 }
    }.bind(this));
    
    this.map.on('click', mapBehaviours.bind(this));
    this.map.on('zoomstart', mapBehaviours.bind(this));
    this.map.on('dragstart', mapBehaviours.bind(this));
    this.map.addLayer(this.cluster);
    this.fitBounds();
	/*this.handleLinkedCities();
	this.polylines.display(this.map);*/
}
function updateMap(){
    var 
    filter = this.currentFilter;
    this.currentBounds = L.latLngBounds();
    
    //check here if city has at least one filtered network
    this.cities.forEach(function(city){
		if(!city.isSurvey){
        if(isFilteredCity(city, this.filteredAccounts, filter)){
            if(!this.cluster.hasLayer(city.marker)){
                this.cluster.addLayer(city.marker);
            }
            this.currentBounds.extend(city.bounds);
        }else{
            this.cluster.removeLayer(city.marker);
        }
		}
        
    }.bind(this));
    fitBounds.call(this);
}
function currentFilter(){
    return (this.checkedTypes.length > 0 ? this.checkedTypes.reduce(function(acc, val){
         return acc + val;
     }) :  0);
}
function handleCities(){
    this.cities.forEach(function(city){
		 if(!city.isSurvey){
        //Compute city types
        city.types = 0; 
        city.bounds = L.latLngBounds();
        city.bounds.extend(L.latLng(city.lat, city.lng), L.latLng(city.lat, city.lng));
        city.namespaces.forEach(function(ns, i){
            //set accounts ref
            this.accounts.forEach(function(acc){
                if(acc.namespace == ns && !acc.isSurvey){
                    city.namespaces[i] = acc; //set ref, will be easier to feach city accounts
                }
            }.bind(this));
        }.bind(this));
        //Create city marker and
        city.marker = L.marker([city.lat, city.lng], {'title': city.name,icon: new CityIcon()});
		 
		 city.marker.setBouncingOptions({
				bounceHeight: 40,
        		bounceSpeed: 60
		  });
		  
		  //city.marker.bounce({duration: 500, height: 100});
        city.marker.on('click', onMarkerClickClosure.call(this, city));
    }}.bind(this));
}
function handleLinkedCities(){
    for(var i = 0 ; i < this.cities.length; i++){
        var 
        cityA = this.cities[i];
        
        for(var j = 0 ; j < this.cities.length ; j++){
            var cityB = this.cities[j];
            this.polylines.create(cityA, cityB);
        }
    }
}
/**
 * Closure to set marker behaviour
 */
function onMarkerClickClosure(city){
    return markerBehaviour.bind(this, city);
}
function markerBehaviour(city){
	this.map.fitBounds(city.bounds);
	this.focusedCity = city;
	city.marker.toggleBouncing();
	setTimeout(function(city){
		this.focusedCity = city;
	}.bind(this, city), 300);
	setTimeout(function(city){
		city.marker.stopBouncing();
	}.bind(this, city), 1000);
}

/**
 * Search list 
 */
function searchItemBehaviour(item){
	if(item.namespace){
		this.cities.forEach(function(city){
			city.namespaces.forEach(function(a){
				if(a === item){
					 markerBehaviour.call(this, city);
				}
			}.bind(this));
		}.bind(this));
	}
	if(item.namespaces){
		markerBehaviour.call(this, item);
	}
	this.showSearchResults = false;
}

function searchedDatas(){
	var temp = this.filteredAccounts.concat(this.filteredCities);
	
	 return temp.sort(compare).filter(function(data){
		 if(data.namespace){
			 return data.pageTitle.toLowerCase().includes(this.search.toLowerCase());
		 }
		 
		 if(data.namespaces){
			 return data.name.toLowerCase().includes(this.search.toLowerCase());
		 }
    }.bind(this));
}

/** move from here ?**/
String.prototype.withoutAccent = function(){
    var accent = [
        /[\300-\306]/g, /[\340-\346]/g, // A, a
        /[\310-\313]/g, /[\350-\353]/g, // E, e
        /[\314-\317]/g, /[\354-\357]/g, // I, i
        /[\322-\330]/g, /[\362-\370]/g, // O, o
        /[\331-\334]/g, /[\371-\374]/g, // U, u
        /[\321]/g, /[\361]/g, // N, n
        /[\307]/g, /[\347]/g, // C, c
    ];
    var noaccent = ['A','a','E','e','I','i','O','o','U','u','N','n','C','c'];
     
    var str = this;
    for(var i = 0; i < accent.length; i++){
        str = str.replace(accent[i], noaccent[i]);
    }
     
    return str;
}

function searchedCities(){
	return this.filteredCities.sort(compare).filter(function(city){
		
		if(city && city.name && city.name.withoutAccent().toLowerCase().includes(this.search.withoutAccent().toLowerCase())){
			return true;
		}

		var result = city.namespaces.filter(function(acc){
			if(acc && acc.pageTitle){
				return acc.pageTitle.withoutAccent().toLowerCase().includes(this.search.withoutAccent().toLowerCase()) ;
			}
			return false;
		}.bind(this));
		
		return result.length > 0;
		
	}.bind(this));
}
/*
acc && acc.city && acc.pageTitle && (acc.city.toLowerCase().includes(search.toLowerCase()) || acc.pageTitle.toLowerCase().includes(search.toLowerCase()))*/

function fetchAccTypes(types){
    return this.networkTypes.filter(function(type){
        return (types & type.value) == type.value;
    }.bind(this));
}
function mapBehaviours(){
	 this.focusedCity = null;
	 this.showSearchResults = false;
}
/**
 * Utils to fit map bounds in function of context
 */
function fitBounds(){
    this.focusedCity = null;
    if(this.currentBounds && this.currentBounds.isValid()){
        this.map.fitBounds(this.currentBounds);
    }else{
        this.map.setZoom(0);
    }
}
/**
 * Utils to test if acc is belong to current filter
 */
function belongTo(a){
	//all
	if(this.checkedFilter == -1){
		return true;
	}
	
	//private
	if(this.checkedFilter == 0){
		return a.pRivate;
	}
	
	return (this.checkedFilter & a.types) == this.checkedFilter;
}
/**
 * Utils to test if acc is belong to current filter
 */
function isFilteredCity(city, accounts, filter){
    for(var i = 0 ; i < city.namespaces.length ; i++){
        if(accounts.indexOf(city.namespaces[i]) > -1){
            return true;
        }
    }
    return false;
}
function filteredCities(){
    var fc = [];
    
    this.cities.forEach(function(city){
		 if(!city.isSurvey){
        
        if(city.namespaces.some(function(acc){return (this.filteredAccounts.indexOf(acc) > -1);}.bind(this))){
            fc.push(city);
        }
		 }
        
    }.bind(this));
    
    return fc;
}
/**
 * Computed method to keep update current "active" accounts (belong to current filter)
 */
function filteredAccounts(){
    var 
    accounts = [];
    
    this.accounts.forEach(function(acc){
		 if(!acc.isSurvey){
        if(belongTo.call(this, acc)){
            accounts.push(acc);
        }
		 }
    }.bind(this));
    
    return accounts;
}
function searchedAccounts(){
    return this.filteredAccounts.sort(compare).filter(function(account){
        return account.pageTitle.toLowerCase().includes(this.search.toLowerCase());
    }.bind(this));
}



function displayUserPosition(){
     if(!this.user && navigator.geolocation){
            navigator.geolocation.getCurrentPosition(function(user){
                this.user = {marker:null, bounds:null, active: false };
                this.user.marker = L.marker([user.coords.latitude, user.coords.longitude], {icon: L.icon({
                    iconUrl: '/assets/img/meIcon.png',
                    iconSize: L.point(50, 50),
                    iconAnchor: L.point(25, 46)
                })});
                this.user.bounds = L.latLngBounds([this.user.marker.getLatLng()]); 
                //this.cluster.addLayer(this.userPosition);
                this.map.addLayer(this.user.marker);
            }.bind(this));
    }
}
function locateUser(){
    if(this.user){
        this.focusedCity = null; //TODO refactor
        if(this.user.active){
            this.fitBounds();
        }else if(this.user.bounds){
            this.map.fitBounds(this.user.bounds);
        }
        this.user.active = !this.user.active;
        
    }else{
        this.fitBounds();
    }
}
function compare(a, b) {
    if (a.name < b.name){
        return -1;
    }
    if (a.name > b.name){
        return 1;
    }
    return 0;
}
function activeFiltersLabel(){
	var result = [];
			
	if(!this.private){
		result.push(messages[this.getLang()].homepage.map.mapexpand.prive);
	}
	this.networkTypes.forEach(function(type){
		if((type.value & this.currentFilter) != type.value){
			result.push(filterLabel(type.value));
		}
	}.bind(this));

	return result.join();
}
function filterLabel(typeV){
	return messages[this.getLang()].homepage.map.mapexpand.types[typeV];
}