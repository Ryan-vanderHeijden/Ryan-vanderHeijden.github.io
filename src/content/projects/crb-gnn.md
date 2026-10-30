---
title: CRB-GNN
subtitle: Forecasting streamflow drought where there is no streamgage
order: 3
summary: Streamflow drought forecasts lean hardest on a river's own recent flow, and an ungaged river doesn't have one. CRB-GNN is a graph neural network for the Upper Colorado River Basin that learns to rebuild that missing signal from weather, basin attributes and neighboring rivers.
stack: Python, PyTorch, PyTorch Geometric Temporal, Optuna
facts:
  - value: "196"
    label: USGS gages in the Upper Colorado graph, with about 45 weekly inputs each
  - value: 7×
    label: faster similarity-graph build at 196 gages, a gap that widens as the graph grows
  - value: "+0.038"
    label: CSI for moderate drought over the best deployable baseline, at held-out basins
diagram: dual-graph
alt: Diagram of the model. Left, a dual graph with river edges running downstream and dashed drought-similarity edges between basins. Right, a flow encoder and a universal encoder feed a temporal graph network, and an imputation network stands in for the flow encoder at ungaged nodes.
caption: Left, the dual graph. Right, the dual encoder. At a gaged node the flow encoder reads observed flow; at an ungaged or masked node the imputation network supplies that encoding instead.
---

## The problem

Operational streamflow drought forecasts such as RiverDroughtCast cover about 3,000 USGS gages, and their feature importance is dominated by each gage's recent flow percentiles. That input doesn't exist at an ungaged river, and most rivers are ungaged. CRB-GNN tests whether a graph model can stand in for it, using the Upper Colorado River Basin, where enough rivers are gaged to hide some and check the answer.

## Architecture

The repository is private, so here is the architecture in place of the code.

- **A dual graph.** Every gage is a node. River edges follow the stream network in both directions and are typed by direction. Drought-similarity edges link basins whose SPEI drought index series share mutual information, even when no river connects them. A small MLP sets each edge's weight from the edge type and both basins' attributes, so the weights carry over to a graph the model has never seen.
- **A dual encoder.** A flow encoder reads antecedent flow percentiles. A universal encoder reads everything that exists for every basin: meteorology, GEFS, ECMWF and NMME forecasts, snow, soil moisture, reservoirs, ENSO and PDO, water use, vegetation, and GAGES-II basin attributes.
- **An imputation network** rebuilds the flow encoding from the universal encoding and the basin's attributes. During training, real gages are randomly masked, ramping from 10% to 30% of nodes, so the model practices being ungaged where the answer is known.
- **A temporal graph network** (A3TGCN, attention over time plus graph convolution) predicts the 5th, 50th and 95th percentile of weekly flow. The pinball loss counts errors below the 30th percentile three times, which tilts the model toward drought.

## Evaluation

The benchmark holds out whole basins, with their edges, in five folds, which is the honest version of "ungaged." The first baseline read the neighbors' flow at the forecast's target date, information a real forecast can't have. That was caught and fixed: the leaky version is kept only as a ceiling, and the deployable baseline uses the nearest gaged basins as of the issue date.

With the drought-weighted loss, the model beats the deployable baseline on critical success index (CSI) for moderate drought (20th percentile) by 0.038, in 70% of the held-out basins, and matches the leaky ceiling at the 30th percentile. Without the weighting it lost to the baseline. A weight of 10 bought more detections but pushed the false-alarm ratio to 0.43, so 3 is the operating point.

## Scaling to the whole country

The goal is all of the contiguous U.S.: 3,000 to 5,000 nodes, plus ungaged targets. The scalability review found that more compute on an HPC system solves the size problems but not the generalization problems, so those were fixed first.

- **Edge weights** are a function of basin attributes instead of one learned number per edge, so new basins can be added without retraining. Left free, they collapsed toward zero and switched off message passing; a small penalty toward 0.5 keeps them alive.
- **Normalization** uses pooled statistics, so a new basin needs no fit of its own.
- **The similarity graph** is now a correlation shortlist followed by mutual information on each node's top candidates. That took construction from 199 to 29 seconds at 196 nodes and left no isolated nodes. The gap widens with N, to an expected 160× at 5,000 gages.
- **Still to do:** build river topology offline from NHDPlus instead of thousands of sequential web-service calls, and add neighbor sampling only if full-graph passes on a GPU prove too slow.
