var SURVEY_FORM; //DOM element

/**
 * Main function to send an email to contact sheet
 */
function sendDatasToSheet(lines, network, city) {
		var args = "form=passengers_survey&lines="+encodeURIComponent(lines)+"&network="+encodeURIComponent(network)+"&city="+encodeURIComponent(city);
		get("https://script.google.com/macros/s/AKfycbzOOFyPsyXzqytgQK8aWzEI1srgCOhKPTCwFwQ5xys8GXEAJiM/exec?"+args).then(function(){
			SURVEY_FORM.classList.add("survey-sent");
		})
		.catch(function(error){
			console.log('error', error.message);
		});
}

function compareSurveyCount(a,b) {
  if (a.surveyCount > b.surveyCount)
    return -1;
  if (a.surveyCount < b.surveyCount)
    return 1;
  return 0;
}

/**
 * Function to init the survey results datas
 */
function initSurveyResults() {
	return new Promise(function(resolve, reject){
		var accsWantedRoutes = [],
			 citiesWithSurvey = [];

		for(var i = 0; i < API.accounts.length; i++ ) {
			if(API.accounts[i].hasOwnProperty("wantedRoutes") && API.accounts[i].wantedRoutes.length != 0) {
				accsWantedRoutes.push(API.accounts[i]);
			}
		}
		var sameCity;
		for(var i = 0; i < API.cities.length; i++ ) {
			sameCity = [];
			for(var j = 0; j < API.cities[i].namespaces.length; j++){
				for(var k = 0; k < accsWantedRoutes.length; k++) {
					if(API.cities[i].namespaces[j] == accsWantedRoutes[k].namespace){
						if(sameCity.length == 0) {
							citiesWithSurvey.push(API.cities[i]);
						}
						sameCity.push(accsWantedRoutes[k]);
					}
				}
			}
			if(sameCity.length != 0){
				citiesWithSurvey[citiesWithSurvey.length-1].accounts = sameCity;
			}

		}

		for(var i = 0; i < citiesWithSurvey.length; i++){
			citiesWithSurvey[i].surveyCount = 0;
			for(var j = 0; j < citiesWithSurvey[i].accounts.length; j++){
				citiesWithSurvey[i].accounts[j].surveyCount = 0;
				for(var k = 0; k < citiesWithSurvey[i].accounts[j].wantedRoutes.length; k++){
					citiesWithSurvey[i].accounts[j].surveyCount += citiesWithSurvey[i].accounts[j].wantedRoutes[k].surveyCount;
					
				}
				citiesWithSurvey[i].accounts[j].wantedRoutes.sort(compareSurveyCount)
				citiesWithSurvey[i].surveyCount += citiesWithSurvey[i].accounts[j].surveyCount;
			}
		}
		citiesWithSurvey.sort(compareSurveyCount);
		resolve(citiesWithSurvey);
	});
}

function buildSurveyResults(datas){
	var resultsDiv = document.getElementById("resultsTree"),
		 totalRequests = 0,
		 totalCityRequests;
	
	for(var i = 0; i < datas.length; i++) {
		totalRequests+= datas[i].surveyCount;
	}
	
	for(var i = 0; i < datas.length; i++) {
		var cityDetails = document.createElement("details"),
			 citySummary = document.createElement("summary"),
			 citySummarySpan = document.createElement("span"),
			 citySummarySpanText = document.createTextNode(datas[i].name),
			 cityAside = document.createElement("aside"),
			 cityAsideContent = datas[i].surveyCount > 1 ? document.createTextNode(datas[i].surveyCount+" demandes") : document.createTextNode(datas[i].surveyCount+" demande"),
			 cityProgress = document.createElement("progress");
		cityProgress.setAttribute("max", 100);
		cityProgress.setAttribute("value", datas[i].surveyCount*100/totalRequests);
		cityProgress.setAttribute("class", "results-tree-city-chart");
		cityAside.appendChild(cityAsideContent);
		cityAside.setAttribute("class", "results-tree-city-number");
		citySummarySpan.appendChild(citySummarySpanText);
		citySummarySpan.setAttribute("class", "results-tree-city-name");
		citySummary.appendChild(citySummarySpan);
		citySummary.appendChild(cityAside);
		citySummary.appendChild(cityProgress);
		citySummary.setAttribute("class", "results-tree-city-title");
		cityDetails.appendChild(citySummary);
		cityDetails.setAttribute("class", "results-tree-city");
		
		for(var j = 0; j < datas[i].accounts.length; j++){
			var accDetails = document.createElement("details"),
				 accSummary = document.createElement("summary"),
				 accSummarySpan = document.createElement("span"),
				 accSummarySpanText = document.createTextNode(datas[i].accounts[j].name),
				 accAside = document.createElement("aside"),
				 accAsideContent = document.createTextNode(datas[i].accounts[j].surveyCount),
				 accProgress = document.createElement("progress"),
				 accUl = document.createElement("ul");
				 
			
			if(datas[i].accounts[j].wantedRoutes.length > 3){
				for(var k=0; k < 3; k++){
					if(datas[i].accounts[j].wantedRoutes[k].surveyCount > 0) {
						var accLi = document.createElement("li");
						accLi.innerHTML = (datas[i].accounts[j].wantedRoutes[k].name == 'All'?'Toutes':datas[i].accounts[j].wantedRoutes[k].name)+' (<span class="results-tree-lines-number">'+datas[i].accounts[j].wantedRoutes[k].surveyCount+'</span>)';
						accLi.setAttribute("class", "results-tree-network-lines-name");
						accUl.appendChild(accLi);
					}
				}
				
				
				var accLastLi = document.createElement("li"),
					 textNode = "Autres : ";
				
				for(var k = 3; k < datas[i].accounts[j].wantedRoutes.length; k++){
					if(datas[i].accounts[j].wantedRoutes[k].surveyCount > 0) {
						textNode += (datas[i].accounts[j].wantedRoutes[k].name == 'All'?'Toutes':datas[i].accounts[j].wantedRoutes[k].name)+" (<span class=\"results-tree-lines-number\">"+datas[i].accounts[j].wantedRoutes[k].surveyCount+"</span>) - ";
					}
				}
				accLastLi.innerHTML = textNode.slice(0,-3);
				accLastLi.setAttribute("class", "results-tree-network-lines-name");
				accUl.appendChild(accLastLi);
			} else {
				for(var k = 0; k < datas[i].accounts[j].wantedRoutes.length; k++){
					if(datas[i].accounts[j].wantedRoutes[k].surveyCount > 0) {
						var accLi = document.createElement("li");
						accLi.innerHTML = (datas[i].accounts[j].wantedRoutes[k].name == 'All'?'Toutes':datas[i].accounts[j].wantedRoutes[k].name)+' (<span class="results-tree-lines-number">'+datas[i].accounts[j].wantedRoutes[k].surveyCount+'</span>)';
						accLi.setAttribute("class", "results-tree-network-lines-name");
						accUl.appendChild(accLi);
					}
				}
			}

			accUl.setAttribute("class", "results-tree-network-lines");
			accProgress.setAttribute("max", 100);
			accProgress.setAttribute("value", datas[i].accounts[j].surveyCount*100/datas[i].surveyCount);
			accProgress.setAttribute("class", "results-tree-network-chart");
			accAside.appendChild(accAsideContent);
			accAside.setAttribute("class", "results-tree-network-number");
			accSummarySpan.appendChild(accSummarySpanText);
			accSummarySpan.setAttribute("class", "results-tree-network-name");
			accSummary.appendChild(accSummarySpan);
			accSummary.appendChild(accAside);
			accSummary.appendChild(accProgress);
			accSummary.setAttribute("class", "results-tree-network-title");
			accDetails.appendChild(accSummary);
			accDetails.appendChild(accUl);
			accDetails.setAttribute("class", "results-tree-network");
			
			cityDetails.appendChild(accDetails);
		}
		
		resultsDiv.appendChild(cityDetails);
		
	}
}

(function(){
	SURVEY_FORM = document.getElementById('surveyForm');
	SURVEY_FORM.addEventListener("submit", function(evt){
		evt.preventDefault();
		var lines = document.getElementById('surveyCheckboxLines').checked ? 'Toutes les lignes' : document.getElementById('surveyInputLines').value,
			 network = document.getElementById('surveyCheckboxNetwork').checked ? 'Je ne connais pas le nom de mon réseau' : document.getElementById('surveyInputNetwork').value,
			 city = document.getElementById('surveyInputCity').value;
		
		document.getElementById('surveySubmit').disabled = true;
			
		sendDatasToSheet(lines, network, city);
	});
	
	// A décommenter quand on aura "assez de données"
	/*initSurveyResults().then(function(response){
		return buildSurveyResults(response);
	})*/
})();

document.getElementById('surveyCheckboxLines').onchange = function() {
	document.getElementById('surveyInputLines').disabled = this.checked;
};
document.getElementById('surveyCheckboxNetwork').onchange = function() {
	document.getElementById('surveyInputNetwork').disabled = this.checked;
};