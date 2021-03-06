import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { MarkerService } from '../../_service/marker.service';
import { ShapeService } from '../../_service/shape.service';
import { HttpClient } from '@angular/common/http';
import { MapTilesService } from '../../_service/map-tiles.service';

interface Country{
  name: string,
  alpha3: string,
  code: number,
  region: string,
  start: string,
  start_reopening: string,
  end: string,
  expected_end: string,
  historical_coverage: string,
  current_coverage: string,
  historical_population_impacted: number,
  current_population_impacted: number,
  historical_severity: string,
  current_severity: string,
  movement_restrictions: boolean,
  curfew: boolean,
  public_closed: boolean,
  movement_enforcement: boolean,
  army: string,
  status: string,
  comment: string,
  start_business_closure: string,
  start_reopening_business: string,
  end_business_closure: string,
  status_business: string,
  expiration_date: string,
  last_update_date: string,
  source: string,
  comments: string
}

const colors = {
  "no_lockdown": "#66bb6a",
  "lockdown": "#e6595a",
  "curfew": "#B55007",
  "re-opening": "#ee7f08",
  "re-openning": "#ee7f08",
  "re-open": "#17a2b8",
  "default": "#555",
  "No data": "#e3e3e3",
  "No Lockdown": "#66bb6a",
  "Lockdown": "#e6595a",
  "Curfew": "#B55007",
  "Re-opening": "#ffeb3b",
  "Re-open": "#17a2b8"
}

@Component({
  selector: 'app-map-lockdown',
  templateUrl: './map-lockdown.component.html',
  styleUrls: ['./map-lockdown.component.css']
})
export class MapLockdownComponent implements OnInit {

  public map: L.map;
  public info: L.control;
  public legend: L.control;
  public countries: Array<Country>;

  constructor(
    private markerService: MarkerService, 
    private shapeService: ShapeService,
    private http: HttpClient,
    private mapTiles: MapTilesService
    ) {
     
    }

  ngOnInit(): void {
    this.http.get('https://covidmeasures-data.s3.amazonaws.com/lockdown.json').subscribe((res:{countries: Array<Country>}) => {
      this.countries = res.countries
      this.initMap();
      this.addInfoBox();
      this.addLegend();
      this.shapeService.getCountriesShapes().subscribe(country => {
        country.features.forEach(item => {
          const foundCountry = this.countries.find(country => country.alpha3 === item.id)
          if (foundCountry) {
            // we add data from apit to each country
            item.countryData = foundCountry
          }else{
            item.countryData = null
          }
        })
        this.initStatesLayer(country);
      });
    // we populate the maps with markers
    // this.markerService.makeStateMarkers(this.map);
    // this.markerService.makeStateCircleMarkers(this.map);
    })
  }
  private initMap(): void{
    // we create the map
    this.map = L.map('map', {
      center: [ 40.416775, -3.703790 ],
      zoom: 3
    });
    // we add tiles for our map
    this.mapTiles.addTiles(this.map)
  }

  private addInfoBox(){
    // we add info box
    this.info = L.control();

    this.info.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
        this.update();
        return this._div;
    };

    const getTextColor = function(text:string, curfew:boolean) {
      if (text) {
        const status = text.toLowerCase()
        return colors[status];
      }
    };
    // method that we will use to update the control based on feature properties passed
    this.info.update = function (country:Country) {
        this._div.innerHTML = 
        '<h4>Lockdown Status</h4>' +  (country ?
        `<b>${ country.name }</b><br />
        <span style="color:${ getTextColor(country.status, country.curfew) }">
          ${ country.curfew ? 'Curfew' : country.status }
        </span>`
        : 'Hover over a Country');
    };

    this.info.addTo(this.map);
  }

  private addLegend(){
    // we add legends to our map
    this.legend = L.control({position: 'bottomright'});
    const getColor = function(status) {
      if (colors.hasOwnProperty(status)) {
        return colors[status]
      }
      return colors['No Data'];
    }
    this.legend.onAdd = function () {

        const div = L.DomUtil.create('div', 'info legend');
        const status = ['No data', 'No Lockdown', 'Lockdown','Curfew','Re-opening', 'Re-open'];
        // loop through our density intervals and generate a label with a colored square for each interval
        for (let i = 0; i < status.length; i++) {
            div.innerHTML +=
                '<i style="background:' + getColor(status[i]) + '"></i>    <strong>' + status[i] + '</strong> <br>';
        }
        return div;
    };

    this.legend.addTo(this.map);
  }

  private initStatesLayer(item) {
    const stateLayer = L.geoJSON(item, {
      style: (feature) => ({
        weight: 3,
        opacity: 0.5,
        color: 'aliceblue',
        fillOpacity: 0.8,
        fillColor: this.getFillColor(feature.countryData)
      }),
      onEachFeature: (feature, layer) => (
        layer.bindPopup(this.clickedCountry(feature.countryData)).on({
          mouseover: (e) => (this.highlightFeature(e)),
          mouseout: (e) => (this.resetFeature(e))
        })
      )
    });
    this.map.addLayer(stateLayer);
  }
  private getFillColor(country: Country) {
    if (country) {
      const status = country.status.toLowerCase();
      const curfew = country.curfew;

      if(status == "no data") return '#e3e3e3';
      if(status == "no lockdown") return '#66bb6a';
      if(status == "lockdown" && !curfew) return '#e6595a';
      if(status == "lockdown" && curfew) return '#B55007';
      if(status == "re-openning" || status == "re-opening") return '#ffeb3b';
      if(status == "re-open") return '#17a2b8';
      else return '#e3e3e3';
    }
    return '#e3e3e3'
  }

  private highlightFeature(e)  {
    const layer = e.target;
    layer.setStyle({
      weight: 2,
      opacity: 1,
      // color: '#DFA612',
      fillOpacity: .6,
      // fillColor: '#FAE042',
    });
    this.info.update(layer.feature.countryData)
  }

  private resetFeature(e)  {
    const layer = e.target;
    layer.setStyle({
      weight: 3,
      opacity: 0.5,
      color: 'aliceblue',
      fillOpacity: 0.8,
      // fillColor: this.getFillColor(id)
    });
    this.info.update()
  }
  private clickedCountry(country){
    if (country) {
      return `
      <div>
        <h6>
          <strong>${country.name}</strong>
        </h6>
        <div class="d-flex justify-content-center">
          <a href="#/country/${country.alpha3}">
            <button class="mat-raised-button mat-button-base mat-primary text-light">More Details</button>
          </a>
        </div>
      </div>
    `;
    }
  }
}
