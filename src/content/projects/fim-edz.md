---
title: FIM-EDZ
subtitle: Floodplain geometry from HAND rasters, from one watershed to a whole lake basin
order: 2
summary: floodplain-routing needs Height Above Nearest Drainage (HAND) rasters, fimbox makes them, and the two didn't fit together. FIM-EDZ connects them without changing either one, then tests how fine the elevation data has to be for the results to hold up.
stack: Python, GDAL, WhiteboxTools, uv, Bash, Slurm
facts:
  - value: 41.5 billion
    label: 1 m grid cells across 118 sub-basins of the Lake Champlain basin
  - value: 98%
    label: of 17,185 reach-stage pairs agree with fimbox's own hydrotable to within 5%
  - value: ~180 km²
    label: drainage area above which half of 10 m reaches match the 3 m map
image: ../../assets/projects/fim-edz-csi.png
alt: Agreement between 10 m and 3 m floodplain maps rises with drainage area. The median CSI sits near 0.5 for small streams and passes 0.7 near 180 square kilometers. The share of reaches that pass reaches 50 percent at 177 and 75 percent at 915 square kilometers.
caption: Each gray point is one river reach in the Winooski or Otter Creek basins in Vermont (736 in all). CSI measures how closely the 10 m channel and EDZ map overlaps the 3 m lidar map. Orange is the running median and interquartile range, and blue is a logistic fit of the share of reaches at CSI 0.7 or better.
---

## The problem

floodplain-routing, a CIROH model developed at UVM, reads HAND rasters and computes reach-averaged channel geometry and energy dissipation zones (EDZs), the parts of a floodplain that slow a flood down. fimbox, an open-source flood inundation mapping toolkit, produces HAND. The two used different file layouts, reach definitions and Python environments, and fimbox doesn't output the total drainage area floodplain-routing needs for every reach.

## How it's built

I didn't modify or vendor either upstream project. A setup script clones both at pinned commits and builds two isolated uv environments, so the whole thing installs without root on a laptop or a cluster login node. Between them sits an adapter of about 190 lines. It converts fimbox's outputs into floodplain-routing's inputs and derives total drainage area from the National Water Model network or NHDPlus HR.

One driver script runs every stage in order: input staging, HAND, the adapter, floodplain-routing, maps and sanity checks. Each step logs its runtime and peak memory, and `--from <stage>` restarts a run at the step where it stopped.

The upstream bugs are handled at run time, with checks and workarounds in the pipeline. fimbox exited 0 when a branch failed, deleted a raster floodplain-routing needed, and overflowed int32 reach IDs. Its memory use on the same basin was 4.8 GB or 0.9 GB depending on the length of the reach-ID prefix. USGS lidar tiles for one basin came in two UTM zones, and a single GDAL mosaic silently dropped one of them.

The results were checked against independent numbers. floodplain-routing's inundated area, bed area and volume match fimbox's own hydrotable (median ratio 1.00), and the derived drainage areas match USGS gages on the main stem to within 0.5%.

## Scale

At 1 m resolution, the Lake Champlain basin comes to 118 sub-basins (HUC12s) and 41.5 billion cells, between 146 million and 1.1 billion per sub-basin. It runs on UVM's VACC cluster.

Each sub-basin is one task in a Slurm array. Memory requests come from a bytes-per-cell model calibrated on pilot runs. The largest pilot peaked at 68.9 GB, or 107 bytes per cell. Tasks are grouped into 64, 96, 128 and 192 GB tiers, so most of them don't ask for the largest node.

One pilot sat in a WhiteboxTools call for 1 hour 47 minutes at 0.2% CPU until it hit its time limit. A watchdog now kills any step that uses no CPU for 20 minutes and retries its sub-basin once. Inside the HAND step, a finer check retries a single call after 10 idle minutes and logs the wait state of every thread. The first full submission ran about 100 tasks at once. Public OpenStreetMap mirrors throttled the downloads, and the waiting looked idle to the watchdog, so the staging step is now exempt.

Resubmitting the job reruns only the tasks that failed, and lidar DEM builds keep the pieces they already finished. The run was budgeted before submission at about 100 to 130 task-hours and 0.65 TB of scratch space.

## What it found

I compared the 10 m and 3 m channel and EDZ maps reach by reach, using 736 reaches in two Vermont basins. At 10 m, half of the reaches agree with the 3 m map (CSI ≥ 0.7) once drainage area reaches about 180 km² (90% interval 143 to 217 km²). Three quarters agree from about 900 km². Below about 100 km², the two runs often disagree on whether a reach has an EDZ at all.

The 10 m pixel size isn't what limits accuracy. When the 3 m map is redrawn on the 10 m grid and scored against itself, the median CSI stays at 0.86 or higher in every size class. Most of the disagreement comes from the 10 m elevation data and the HAND computed from it. The 3 m maps use lidar and the 10 m maps use 3DEP, so source and resolution aren't fully separated yet.

The working configuration follows from that: 10 m with NHDPlus HR flowlines for whole basins, at about five minutes and 7 GB per HUC8, and 3 m lidar for individual sub-basins where small streams matter.
