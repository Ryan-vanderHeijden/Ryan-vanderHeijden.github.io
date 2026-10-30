---
title: Flood Hazard
subtitle: How rare are the National Weather Service's flood stages?
order: 1
summary: The National Weather Service sets action, minor, moderate and major flood stages gage by gage from local impacts, but a stage says nothing about how often a river reaches it. This project fits flood frequency curves at more than 3,000 gages to give each threshold a return period, so the four levels can be compared across the country.
stack: Python, pandas, cartopy, matplotlib, USGS and NOAA web services
facts:
  - value: "236,743"
    label: annual peak flows behind 3,312 Bulletin 17C fits
  - value: 1.7 → 50 yr
    label: median return period from action to major stage, under present-day conditions
  - value: 30%
    label: of major thresholds sit above the rating curve and enter as lower bounds, not gaps
image: ../../assets/projects/flood-hazard-hexmaps.png
alt: Four maps of the contiguous United States in 150 km hexagons, one per NWS flood level. Action stage is mostly pale yellow, under 2 years, across the Midwest, Plains and East. The colors darken level by level until the major map is mostly navy and purple, 25 to over 100 years, with longer return periods in the arid West.
caption: Median return period of each NWS flood level, pooled into 150 km hexagons. Smaller hexagons hold fewer gages (3 to 10 or more), and hatching marks a hexagon whose median is only a lower bound. Present-day fits throughout.
---

## The problem

NOAA's National Water Model forecasts where flood water will go, but not how bad it will be. The NWS flood stages are the obvious yardstick, but each is set locally as a stage, so "major" at one gage may be a 10-year flood and at another a 200-year one. Giving every threshold an annual exceedance probability makes the four levels comparable, and ties impact-based stages to the design floods used in engineering.

## How it's built

The repository is private, so here is the architecture in place of the code.

- **Three pipelines.** The first pulls site metadata, daily flow and stage, NWS thresholds, rating curves and channel geometry from USGS and NOAA services. The second pulls National Water Model retrospective flows. The third runs the flood frequency analysis. Downloads run in parallel and write checkpoints, so a crash resumes instead of starting over.
- **From 9,067 gages to 3,312 fitted sites.** Gages are matched to NWS forecast points through the HADS crosswalk. NWS publishes thresholds as stages, so each one is read through the gage's active USGS rating curve to get a flow.
- **Bulletin 17C fits.** Log-Pearson III with the Expected Moments Algorithm, with censored, historical and low-outlier peaks each handled the way the federal guidelines require. Station skew is used everywhere, because published regional skew covers only 16 states and mixing the two would make results depend on state lines.
- **Checked against published estimates.** At the 1,789 sites with USGS StreamStats values, the 2-year flood agrees at R² = 0.97 (log), with 90% of sites within 25%.
- **Non-stationarity handled before mapping.** Every record of 30 years or more is screened for trends (Mann–Kendall) and step changes (Pettitt), and the changes are attributed to dams, regulation or urbanization. Regulated gages are refit on the record after the largest upstream dam, as Bulletin 17C asks. Unregulated gages in urbanizing basins are refit on their recent record.

## The hexagon maps

Thousands of gage dots overlap and hide each other at national scale, so the regional maps pool gages into hexagons.

- **Gages snap to a hexagonal grid** 150 km across, laid out in the map's equal-area Albers projection so every cell covers the same ground.
- **Each hexagon shows a Kaplan–Meier median.** Thresholds above the top of the rating curve have no flow, only a floor on their return period. Dropping them would remove the rarest floods: the national major-stage median would fall from 50 to 27 years. They are treated as right-censored observations instead, and a hexagon where more than half the gages are bounds is hatched to show its median is a floor too.
- **Hexagon size shows how many gages it holds.** Color lightness already encodes return period, so fading sparse cells would make them look like more frequent floods. They shrink instead, from a quarter area at 3 gages to full size at 10.
- **The color ramp was built for this figure,** six steps in OKLCH with monotone lightness. Every neighboring pair stays distinguishable under normal vision and simulated color blindness, so the two darkest classes differ in hue, navy against purple, not only in lightness.

## What it found

- **The levels step up in rarity:** 1.7, 3.5, 11 and 50 years at the median gage. The spread between gages is wide, with major flooding ranging from a few years to beyond 100.
- **The regional pattern only shows once gages are pooled.** Action and minor stages are reached about every one to five years across the Midwest, Plains and much of the East, and return periods run longer in the arid West.
- **Regulation matters most for small floods.** At regulated gages, action and minor stages are reached less often, consistent with reservoirs absorbing small floods. At major they match unregulated gages (51 against 49 years) once records are refit for present-day regulation. Full-record fits had put regulated gages at 37 years, counting floods the dams now prevent.
- **Urbanizing basins reach their moderate and major stages about 1.5 times as often** as their full records imply.
