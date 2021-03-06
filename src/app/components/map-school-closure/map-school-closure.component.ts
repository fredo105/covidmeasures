import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { MarkerService } from '../../_service/marker.service';
import { ShapeService } from '../../_service/shape.service';
import { MapTilesService } from '../../_service/map-tiles.service';
import { HttpClient } from '@angular/common/http';

interface Country {
  name: string;
  alpha3: string;
  code: string;
  region: string;
  start:string;
  start_reopening: string;
  school_closure: boolean;
  historical_coverage: string;
  current_children_no_school: number;
  historical_children_no_school: number;
  current_coverage: string;
  status: string
}

@Component({
  selector: 'app-map-school-closure',
  templateUrl: './map-school-closure.component.html',
  styleUrls: ['./map-school-closure.component.css']
})


export class MapSchoolClosureComponent implements OnInit {

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
    ngOnInit():void {
      this.http.get('https://covidmeasures-data.s3.amazonaws.com/school_closure.json').subscribe((res:{countries: Array<Country>}) => {
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

    ngAfterViewInit(): void {}

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

      const getTextColor = function(text:string) {
        if (text) {
          const status = text.toLowerCase()
          let color:string;
          switch (status as any) {
            case "no closure":
              color = '#28a745';
              break;
            case "closure":
              color = '#e6595a';
              break;
            case "re-opening":
              color = '#ee7f08';
              break;
            case "re-openning":
              color = '#ee7f08';
              break;
            case "re-open":
              color = '#17a2b8';
              break;
            default:
              color = '#555';
              break;
          }
          return color
        }
      };
      // method that we will use to update the control based on feature properties passed
      this.info.update = function (country:Country) {
          this._div.innerHTML = 
          '<h4>School Closure Status</h4>' +  (country ?
          `<b>${country.name}</b><br />
          <span style="color:${getTextColor(country.status)}">${country.status}</span>`
          : 'Hover over a Country');
      };

      this.info.addTo(this.map);
    }

    private addLegend(){
      // we add legends to our map
      this.legend = L.control({position: 'bottomright'});
      const getColor = function(status) {
        return  status == "No data" ? '#e3e3e3' :
                status == "No closure" ? '#28a745' :
                status == "Nationwide Closure" ? '#e6595a' :
                status == "Partial Closure" ? '#ee7f08' : 
                status == "Re-opening" ? '#ffeb3b' : 
                status == "Re-open"  ? '#17a2b8' :
                          '#e3e3e3';
      }
      this.legend.onAdd = function (map) {

          const div = L.DomUtil.create('div', 'info legend'),
              status = ['No data', 'No closure', 'Nationwide Closure', 'Partial Closure', 'Re-opening', 'Re-open'],
              labels = [];

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
        if(country.status.toLowerCase() == "no data") return '#e3e3e3';
        if(
          country.status.toLowerCase() == "no closure") return '#28a745';
        if(
          country.status.toLowerCase() == "closure" && 
          country.current_coverage.toLowerCase() == "general"
          ) return '#e6595a';
        if(
          country.status.toLowerCase() == "closure" && 
          country.current_coverage.toLowerCase() == "partial"
          ) return '#ee7f08';
        if(
          country.status.toLowerCase() == "re-openning" || 
          country.status.toLowerCase() == "re-opening"
          ) return '#ffeb3b';
        if(country.status.toLowerCase() == "re-open") return '#17a2b8';
        else return '#e3e3e3'
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
