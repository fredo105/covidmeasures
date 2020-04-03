import Chart from 'chart.js';

import * as deathCases from './data/latest_deaths.json';

export const createPieChart = (
  ctx: CanvasRenderingContext2D, labels: string[], dataset: number[], backgroundColor: string[]
) => {
  return new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        backgroundColor,
        data: dataset
      }]
    },
    options: {
      legend: {
        display: false
      }
    }
  })
}

export const createVerticalBarChart = (
  ctx: CanvasRenderingContext2D, labels: string[], dataset: number[], backgroundColor: string[]
) => {
  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        backgroundColor,
        data: dataset
      }]
    },
    options: {
      legend: {
        display: false
      },
      tooltips: {
        backgroundColor: '#f5f5f5',
        titleFontColor: '#333',
        bodyFontColor: '#666',
        mode: "nearest",
        intersect: false,
        position: "nearest",
        callbacks: {
          label: function(tooltipItem: any) {
            const allDeaths = deathCases.data[deathCases.data.length-1];
            return tooltipItem.yLabel+"%, "+Math.floor((allDeaths*tooltipItem.yLabel)/100)+" deaths";
          }
        }
      },
    }
  });
}

export const createBarChart = (
  ctx: CanvasRenderingContext2D, labels: string[], dataset: number[], backgroundColor
) => {
  return new Chart(ctx, {
    type: 'horizontalBar',
    responsive: true,
    legend: {
      display: false
    },
    data: {
      labels,
      datasets: [{
        backgroundColor,
        data: dataset,
      }]
    },
    options: {
      maintainAspectRatio: false,
      legend: {
        display: false
      },
      showAllTooltips: true,
      tooltips: {
        backgroundColor: '#f5f5f5',
        titleFontColor: '#333',
        bodyFontColor: '#666',
        mode: "nearest",
        intersect: 0,
        position: "nearest",
        callbacks: {
          label: function(tooltipItem: any) {
            return tooltipItem.xLabel.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
          }
        }
      },
      responsive: true,
      scales: {
        yAxes: [{
    
          gridLines: {
            color: 'rgba(29,140,248,0.1)',
          },
          ticks: {
            padding: 0,
            fontColor: "#9e9e9e"
          }
        }],
    
        xAxes: [{
    
          gridLines: {
            drawBorder: false,
            color: 'rgba(29,140,248,0.1)',
            zeroLineColor: "transparent",
          },
          ticks: {
            userCallback: function(value) {
              value = value.toString();
              value = value.split(/(?=(?:...)*$)/);
              value = value.join(',');
              return value;
            },
            padding: 0,
            fontColor: "#9e9e9e"
          }
        }]
      }
    }
  });
}

export const createStackedBarChart = (
  ctx: CanvasRenderingContext2D, labels: string[],
  dataset1: number[], backgroundColor1: string[], label1: string,
  dataset2: number[], backgroundColor2: string[], label2: string
) => {
  return new Chart(ctx, {
    type: 'horizontalBar',
    responsive: true,
    data: {
      labels,
      datasets: [{
        label: label1,
        backgroundColor: backgroundColor1,
        data: dataset1,
      },
      {
        label: label2,
        backgroundColor: backgroundColor2,
        data: dataset2,
      }]
    },
    options: {
      maintainAspectRatio: false,
      legend: {
        display: true
      },
      showAllTooltips: true,
      tooltips: {
        backgroundColor: '#f5f5f5',
        titleFontColor: '#333',
        bodyFontColor: '#666',
        mode: "nearest",
        intersect: 0,
        position: "nearest",
        callbacks: {
          label: function(tooltipItem: any) {
            return tooltipItem.xLabel.toFixed(5).toString()+'%';
          }
        }
      },
      responsive: true,
      scales: {
        yAxes: [{
          stacked: true,
          gridLines: {
            color: 'rgba(29,140,248,0.1)',
          },
          ticks: {
            padding: 0,
            fontColor: "#9e9e9e"
          }
        }],
    
        xAxes: [{
          stacked: true,
          gridLines: {
            drawBorder: false,
            color: 'rgba(29,140,248,0.1)',
            zeroLineColor: "transparent",
          },
          // ticks: {
          //   userCallback: function(value) {
          //     value = value.toString();
          //     value = value.split(/(?=(?:...)*$)/);
          //     value = value.join(',');
          //     return value;
          //   },
          //   padding: 0,
          //   fontColor: "#9e9e9e"
          // }
        }]
      }
    }
  });
}