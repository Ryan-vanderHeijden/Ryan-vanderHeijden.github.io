---
title: Flood Hazard
subtitle: How rare are the National Weather Service's flood stages?
order: 1
summary: The National Weather Service sets action, minor, moderate and major flood stages gage by gage, based on local impacts. A stage says nothing about how often a river reaches it, so I fit flood frequency curves at more than 3,000 gages and gave every threshold a return period that can be compared across the country.
stack: Python, pandas, cartopy, matplotlib, USGS and NOAA web services
facts:
  - value: "236,743"
    label: annual peak flows behind 3,312 Bulletin 17C fits
  - value: 1.7 to 50 yr
    label: median return period from action to major stage, under present-day conditions
  - value: 30%
    label: of major thresholds sit above the rating curve and are kept as lower bounds
image: ../../assets/projects/flood-hazard-hexmaps.png
alt: Four maps of the contiguous United States in 150 km hexagons, one per NWS flood level. Action stage is mostly pale yellow, under 2 years, across the Midwest, Plains and East. The colors darken level by level until the major map is mostly navy and purple, 25 to over 100 years, with longer return periods in the arid West.
caption: Median return period of each NWS flood level, pooled into 150 km hexagons. Smaller hexagons hold fewer gages (3 to 10 or more), and hatching marks a hexagon whose median is only a lower bound. All fits are present-day fits.
---

## The problem

NOAA's National Water Model forecasts where flood water will go, but not how bad the flooding will be. NWS flood stages are the obvious yardstick, except that each one is set locally as a stage. "Major" at one gage might be a 10-year flood and at another a 200-year flood. An annual exceedance probability for every threshold puts the four levels on one scale, and it connects impact-based stages to the design floods engineers already use.

## How it's built

Three pipelines feed the analysis. The first pulls site metadata, daily flow and stage, NWS thresholds, rating curves and channel geometry from USGS and NOAA web services. The second pulls National Water Model retrospective flows, and the third runs the flood frequency analysis. Downloads run in parallel and write checkpoints, so a crash picks up where it left off.

The study starts with 9,067 USGS gages and ends with 3,312 fitted sites. Gages are matched to NWS forecast points through the HADS crosswalk. NWS publishes its thresholds as stages, so I read each one through the gage's current USGS rating curve to get a flow.

The fits follow Bulletin 17C: log-Pearson III with the Expected Moments Algorithm, with censored, historical and low-outlier peaks each handled as the guidelines require. I used station skew everywhere. Published regional skew covers only 16 states, and mixing the two would make results jump at state lines. Against USGS StreamStats estimates at 1,789 shared sites, the 2-year flood agrees at R² = 0.97 (log), and 90% of sites are within 25%.

Before mapping, every record of 30 years or more is screened for gradual trends (Mann-Kendall) and step changes (Pettitt), and each change is checked against dam construction, regulation and urban growth upstream. Regulated gages are refit on the record after their largest upstream dam was built, as Bulletin 17C recommends. Unregulated gages in urbanizing basins are refit on their recent record.

## The hexagon maps

At national scale, thousands of gage dots pile on top of each other and the regional pattern disappears. The maps pool gages into hexagons instead.

Each gage snaps to the nearest cell of a 150 km hexagonal grid. The grid is laid out in the map's equal-area Albers projection, so every cell covers the same ground.

A hexagon's color is the Kaplan-Meier median of its gages' return periods. Thresholds above the top of the rating curve have no flow, only a floor on their return period, and they are disproportionately the rare ones. Dropping them would pull the national major-stage median from 50 years down to 27. I treat them as right-censored observations instead. When more than half of a hexagon's gages are bounds, its median is a floor too, and the hexagon is hatched.

Size shows how many gages a hexagon holds. Lightness already encodes return period, so fading sparse cells would make them read as more frequent floods. Sparse hexagons shrink instead, from a quarter of full area at 3 gages to full size at 10.

The six-step color ramp was built in OKLCH for this figure, with lightness that changes steadily from step to step. Every neighboring pair stays distinguishable under normal vision and simulated color blindness, which is why the two darkest classes are different hues (navy and purple) and not just different shades.

## What it found

The four levels step up in rarity: 1.7, 3.5, 11 and 50 years at the median gage. The spread between gages is wide, and major flooding ranges from every few years to rarer than once a century.

Pooling makes the regional pattern clear. Across the Midwest, the Plains and much of the East, action and minor stages come back every one to five years. Return periods run longer in the arid West.

Regulation matters mostly for small floods. Regulated gages reach action and minor stages less often, which fits reservoirs absorbing small floods. At major stage, regulated and unregulated gages come out about the same (51 and 49 years) once the regulated records are refit for present-day conditions. Full-record fits had put regulated gages at 37 years, because they counted floods the dams now prevent.

In urbanizing basins, moderate and major stages now come about 1.5 times as often as the full records suggest.
