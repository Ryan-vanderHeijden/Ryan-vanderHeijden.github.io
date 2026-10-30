---
title: FIM-EDZ
subtitle: Floodplain geometry from HAND rasters, from one watershed to a whole lake basin
order: 2
summary: floodplain-routing needs Height Above Nearest Drainage (HAND) rasters, fimbox makes them, and the two didn't fit together. FIM-EDZ joins them without changing either one, then tests how fine the elevation data has to be for the results to hold.
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
caption: Each gray point is one river reach in the Winooski or Otter Creek basins in Vermont (736 in all). CSI measures how closely the 10 m channel and EDZ map overlaps the 3 m lidar map. Orange shows the running median and interquartile range. Blue is a logistic fit of the share of reaches that reach CSI 0.7.
---

## The problem

floodplain-routing, a CIROH model developed at UVM, reads HAND rasters and computes reach-averaged channel geometry and energy dissipation zones (EDZs), the parts of a floodplain that slow a flood down. fimbox, an open-source flood inundation mapping toolkit, produces HAND. The two disagreed on file layout, reach definitions and Python environments, and fimbox's outputs don't include the total drainage area that floodplain-routing needs for every reach.

## How it's built

The repository is private, so here is the architecture in place of the code.

- **Neither upstream project is modified or vendored.** A setup script clones both at pinned commits and builds two isolated uv environments, so the whole thing installs without root on a laptop or a cluster login node.
- **A thin adapter, about 190 lines,** converts fimbox's outputs into floodplain-routing's inputs and derives total drainage area from the National Water Model network or NHDPlus HR.
- **One driver runs every stage:** input staging, HAND, the adapter, floodplain-routing, maps and sanity checks. Each step is logged with its runtime and peak memory, and `--from <stage>` resumes a run where it stopped.
- **Upstream problems are fixed at run time, not by patching upstream code.** fimbox exited 0 when a branch failed, deleted a raster the consumer needed, overflowed int32 reach IDs, and used 4.8 GB or 0.9 GB on the same basin depending on how long the reach-ID prefix was. USGS lidar tiles that came in two UTM zones were silently dropped by a single mosaic. Each of these has a check or a workaround in the pipeline.
- **The numbers are checked against independent sources.** The consumer's inundated area, bed area and volume match fimbox's own hydrotable (median ratio 1.00), and the derived drainage areas match USGS gages on the main stem to within 0.5%.

## Scale

The full Lake Champlain basin at 1 m resolution comes to 118 sub-basins (HUC12s) and 41.5 billion cells, between 146 million and 1.1 billion per sub-basin. It runs on UVM's VACC cluster.

- **Slurm arrays grouped by memory tier.** Each sub-basin is one array task. Its memory request comes from a bytes-per-cell model calibrated on pilot runs (the largest pilot peaked at 68.9 GB, 107 bytes per cell), so tasks land in 64, 96, 128 or 192 GB tiers instead of all asking for the largest.
- **A stall watchdog.** One pilot sat for 1 hour 47 minutes in a WhiteboxTools call at 0.2% CPU, until its time limit. Now a step that uses no CPU for 20 minutes is killed and its sub-basin retried once, and inside the HAND step any single call that goes 10 minutes without CPU is retried on its own, with every thread's wait state logged. The first full submission, about 100 tasks at once, showed that downloads throttled by public OpenStreetMap mirrors also look idle, so staging is now exempt.
- **Runs resume after failures.** Resubmitting reruns only what failed, and lidar DEM builds keep their finished pieces.
- **Budgeted up front:** about 100 to 130 task-hours and 0.65 TB of scratch space.

## What it found

The 10 m and 3 m channel and EDZ maps were compared reach by reach in two Vermont basins, using 736 reaches. **At 10 m, half of the reaches agree with the 3 m map (CSI ≥ 0.7) from about 180 km² of drainage area** (90% interval 143–217 km²), and three quarters agree from about 900 km². Below about 100 km², the two runs often disagree on whether a reach has an EDZ at all.

**Pixel size is not the limit.** Redrawing the 3 m map on the 10 m grid and scoring it against itself keeps the median CSI at 0.86 or higher in every size class. The disagreement comes from the 10 m elevation data and the HAND computed from it. The comparison is lidar at 3 m against 3DEP at 10 m, so source and resolution aren't fully separated yet.

That led to the working configuration: 10 m with NHDPlus HR flowlines for whole basins, at about five minutes and 7 GB per HUC8, plus 3 m lidar for individual sub-basins where small streams matter.
