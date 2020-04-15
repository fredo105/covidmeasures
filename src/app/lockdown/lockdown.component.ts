import { Component, OnInit } from '@angular/core';
import Chart from 'chart.js';

import { getCountryNameByAlpha, getCountryPopulation, getRegionByAlpha, createPieChart } from '../utils';
import * as lockdownData from '../data/lockdown';
import * as text from '../data/texts/lockdown';

interface Location {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-lockdown',
  templateUrl: './lockdown.component.html',
  styleUrls: ['./lockdown.component.css']
})
export class LockdownComponent implements OnInit {
  public isMobile: boolean;
  
  public lockdown_intro_1: string;
  public lockdown_tab_1_below: string;
  public lockdown_tab_2_below: string;

  public locations: Location[] = [
    {value: 'World', viewValue: 'World'},
    {value: 'Northern America', viewValue: 'North America'},
    {value: 'Europe', viewValue: 'Europe'},
    {value: 'Asia', viewValue: 'Asia'},
    {value: 'Africa', viewValue: 'Africa'},
    {value: 'Oceania', viewValue: 'Oceania'},
    {value: 'Latin America and the Caribbean', viewValue: 'Latin America and the Caribbean'},
  ]

  public statsHeaders = [
    'Name', 'Population Impacted', 'Lockdown', 'Curfew', 'Business Closure', 'Other Measures', 'Start', 'End', 'Duration', 'Status'
  ];

  public lockdownTable = [];
  public lockdownTableFull = [];

  public lockdownRegion = "World";
  public lockdownPieChartCountriesRegion = "World";
  public lockdownPieChartPopulationRegion = "World";
  public lockdownImpactedPeople: number;
  public curfewImpactedPeople: number;
  public averageDaysMissed: number;

  public lockdownTableUpdatedOn = 'April 11th, 2020';

  private lockdownCountriesPieChart: Chart;
  private lockdownPopulationPieChart: Chart;

  constructor() { }

  ngOnInit() {
    this.isMobile = window.innerWidth > 991 ? false : true;
    this.setTexts();
    this.setLockdownStatistics();
    this.lockdownChangeRegion('World');

    const labels = ['Lockdown', 'Curfew', 'Removed Restrictions', 'No Or Light Restrictions', 'No Data']
    const backgroundColor = ['#ffa600', '#ff6361', '#bc5090', '#58508d', '#003f5c'];
    const countries = this.getCountriesByRegion('World');

    const countriesDatasets = this.getCountriesData(countries);
    const countriesCTX = (document.getElementById("lockdownCountriesPieChart") as any).getContext("2d");
    this.lockdownCountriesPieChart = createPieChart(countriesCTX, labels, countriesDatasets, backgroundColor, 'Countries');

    const populationDatasets = this.getPopulationData(countries);
    const populationCTX = (document.getElementById("lockdownPopulationPieChart") as any).getContext("2d");
    this.lockdownPopulationPieChart = createPieChart(populationCTX, labels, populationDatasets, backgroundColor, 'People');
  }

  private setTexts() {
    this.lockdown_intro_1 = text.default.lockdown_intro_1;
    this.lockdown_tab_1_below = text.default.lockdown_tab_1_below;
    this.lockdown_tab_2_below = text.default.lockdown_tab_2_below;
  }

  private getCountriesData(countries) {
    let lockdown = 0;
    let curfew = 0;
    let removedRestrictions = 0;
    let lightRestrictions = 0;
    let noData = 0;
    for (const country of countries) {
      if (country.end !== "N/A") {
        removedRestrictions++;
      } else if (country.restriction_type === "Lockdown") {
        lockdown++;
      } else if (country.restriction_type === "Curfew") {
        curfew++;
      } else if (country.restriction_type === "Businesses Shutdown") {
        lightRestrictions++;
      } else {
        noData++;
      }
    }
    return [lockdown, curfew, removedRestrictions, lightRestrictions, noData];
  }

  private getPopulationData(countries) {
    let lockdown = 0;
    let curfew = 0;
    let removedRestrictions = 0;
    let lightRestrictions = 0;
    let noData = 0;
    for (const country of countries) {
      const population = getCountryPopulation(country["alpha-3"]);
      if (country.end !== "N/A") {
        removedRestrictions += Math.floor(population*country.population_affected);
        lightRestrictions += Math.floor(population*(1-country.population_affected));
      } else if (country.restriction_type === "Lockdown") {
        lockdown += Math.floor(population*country.population_affected);
        lightRestrictions += Math.floor(population*(1-country.population_affected));
      } else if (country.restriction_type === "Curfew") {
        curfew += Math.floor(population*country.population_affected);
        lightRestrictions += Math.floor(population*(1-country.population_affected));
      } else if (country.restriction_type === "Businesses Shutdown") {
        lightRestrictions += population;
      } else {
        noData += population;
      }
    }
    return [lockdown, curfew, removedRestrictions, lightRestrictions, noData];
  }

  public lockdownChangeRegion(region: string) {
    this.lockdownRegion = region;
    const countries = this.getCountriesByRegion(region);
    const restrictionData = this.getPopulationData(countries);
    // 0 - lockdown, 2 - restrictions removed
    this.lockdownImpactedPeople = Math.floor(restrictionData[0]+restrictionData[2]);
    // 1 - curfew
    this.curfewImpactedPeople = Math.floor(restrictionData[1]);
    this.averageDaysMissed = this.getAverageDaysMissedPerRegion(countries);
  }

  public lockdownChangePieChartCountriesRegion(region: string) {
    this.lockdownPieChartCountriesRegion = region;
    const countries = this.getCountriesByRegion(region);
    this.lockdownCountriesPieChart.data.datasets[0].data = this.getCountriesData(countries);
    this.lockdownCountriesPieChart.update();
  }

  public lockdownChangePieChartPopulationRegion(region: string) {
    this.lockdownPieChartPopulationRegion = region;
    const countries = this.getCountriesByRegion(region);
    this.lockdownPopulationPieChart.data.datasets[0].data = this.getPopulationData(countries);
    this.lockdownPopulationPieChart.update();
  }

  private getAverageDaysMissedPerRegion(countries) {
    const missedDays = countries.map(country => this.getMissedDaysPerCountry(country));
    const reducer = (acc: number, currVal: number) => {return currVal + acc};
    return Math.floor(missedDays.reduce(reducer)/missedDays.filter(
      days => { return days > 0 ? true: false }
    ).length);
  }

  private getCountriesByRegion(region: string) {
    let countries;
    if (region === "World") {
      countries = lockdownData.default;
    } else {
      countries = lockdownData.default.filter(country => {
        return getRegionByAlpha(country["alpha-3"]) === region ? true : false;
      })
    }
    return countries;
  }

  private setLockdownStatistics() {
    let duration;
    let population;
    for (const country of lockdownData.default) {
      duration = this.getMissedDaysPerCountry(country);
      population = getCountryPopulation(country['alpha-3'])*country.population_affected;
      this.lockdownTableFull.push({
        "name": getCountryNameByAlpha(country['alpha-3']),
        "population": population === 0 ? '' : population,
        "duration": duration === 0 ? '' : duration,
        "lockdown": country.lockdown === 'N/A' ? '' : country.lockdown,
        "curfew": country.curfew === 'N/A' ? '' : country.curfew,
        "business": country.business === "N/A" ? '' : country.business,
        "other": this.getOtherMeasures(country),
        "start": this.getDate(country['start']),
        "end": this.getEndDate(country['end'], country['expected_end']),
        "status": country['status']
      });
    }
    this.lockdownTable = this.lockdownTableFull.slice(0, 10);
  }

  private getEndDate(end: string, expectedEnd: string) {
    if (end !== 'N/A') {
      return new Date(end).toDateString();
    }
    return expectedEnd === 'N/A' ? '' : new Date(expectedEnd).toDateString();
  }

  private getOtherMeasures(country) {
    const measures = [];
    if (country.public_closed === true) {
      measures.push('Public Places Closed');
    }
    if (country.movement_enforcement === "Yes") {
      measures.push('Movement Enforcement');
    }
    if (country.army === true) {
      measures.push('Army Intervention');
    }
    return measures;
  }

  private getMissedDaysPerCountry(country: any) {
    if (country.start === '') {
      return 0
    }
    const start = new Date(country.start);
    const today = new Date()
    const planedEnd = country.end === 'N/A' ? today : new Date(country.end);
    const end = today < planedEnd ? today : planedEnd;
    return Math.floor((end.getTime()-start.getTime())/(1000*60*60*24));
  }

  private getDate(date: string) {
    return date === '' ? '' : (new Date(date)).toDateString();
  }

  applyFilter(event: Event) {
    const search = (event.target as any).value.toLowerCase();
    this.lockdownTable = this.lockdownTableFull.filter(
      row => row.name.toLowerCase().includes(search)
    ).slice(0, 10);
  }
}
