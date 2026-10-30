---
title: CRB-GNN
subtitle: Forecasting streamflow drought where there is no streamgage
order: 3
summary: Streamflow drought forecasts depend most on a river's own recent flow, and an ungaged river has no record of it. CRB-GNN is a graph neural network for the Upper Colorado River Basin that learns to reconstruct that missing signal from weather, basin attributes and neighboring rivers.
stack: Python, PyTorch, PyTorch Geometric Temporal, Optuna
facts:
  - value: "196"
    label: USGS gages in the Upper Colorado graph, with about 45 weekly inputs each
  - value: 7×
    label: faster similarity-graph build at 196 gages, with a larger gap as the graph grows
  - value: "+0.038"
    label: CSI for moderate drought over the best deployable baseline, at held-out basins
diagram: dual-graph
alt: Diagram of the model. Left, a dual graph with river edges running downstream and dashed drought-similarity edges between basins. Right, a flow encoder and a universal encoder feed a temporal graph network, and an imputation network stands in for the flow encoder at ungaged nodes.
caption: Left, the dual graph. Right, the dual encoder. At a gaged node the flow encoder reads observed flow. At an ungaged or masked node the imputation network supplies that encoding instead.
---

## The problem

Operational streamflow drought forecasts such as RiverDroughtCast cover about 3,000 USGS gages, and each gage's recent flow percentiles are their most important input. Most rivers are ungaged and have no such input. CRB-GNN tests whether a graph model can fill the gap. The Upper Colorado River Basin is a good test bed because enough of its rivers are gaged that some can be hidden from the model and the answer checked.

## Architecture

The model works on a dual graph. Every gage is a node. River edges follow the stream network in both directions and carry their direction as an edge type. Drought-similarity edges connect basins whose SPEI drought index series share mutual information, whether or not a river connects them. A small MLP sets each edge's weight from the edge type and the attributes of the two basins it joins. Because the weights come from attributes and not from a lookup table, they carry over to a graph the model hasn't seen.

Inputs go through two encoders. The flow encoder reads antecedent flow percentiles. The universal encoder reads everything available for every basin, gaged or not: meteorology, GEFS, ECMWF and NMME forecasts, snow, soil moisture, reservoirs, ENSO and PDO, water use, vegetation, and GAGES-II basin attributes.

An imputation network rebuilds the flow encoding from the universal encoding and the basin's attributes. During training, real gages are masked at random, starting at 10% of nodes and ramping to 30%, so the model gets practice at being ungaged on cases where the answer is known.

A temporal graph network (A3TGCN, which combines attention over time with graph convolution) predicts the 5th, 50th and 95th percentiles of weekly flow. The pinball loss counts errors below the 30th percentile three times, which pushes the model to get droughts right.

## Evaluation

The benchmark holds out whole basins, edges included, in five folds, so held-out basins look like truly ungaged ones. My first baseline read the neighboring gages' flow at the forecast's target date, which a real forecast could never know. I caught the leak and fixed it. That version is now kept only as a ceiling, and the deployable baseline uses the nearest gaged basins as of the issue date.

With the drought-weighted loss, the model beats the deployable baseline on critical success index (CSI) for moderate drought (20th percentile) by 0.038, in 70% of held-out basins. At the 30th percentile it matches the leaky ceiling. Without the weighting it lost to the baseline. A weight of 10 caught more droughts but raised the false-alarm ratio to 0.43, so I settled on 3.

## Scaling to the whole country

The goal is the contiguous U.S.: 3,000 to 5,000 gages plus ungaged targets. A scalability review found that HPC compute would handle the size, but several parts of the model couldn't generalize to new basins at any size. I fixed those first.

Edge weights now come from basin attributes, not one learned number per edge, so new basins can join without retraining. Left unconstrained, the weights collapsed toward zero and shut off message passing between gages. A small penalty pulling them toward 0.5 keeps them active.

Input normalization uses statistics pooled across gages, so a new basin doesn't need a fit of its own.

The similarity graph is built from a correlation shortlist, with mutual information computed only for each node's top candidates. Construction dropped from 199 seconds to 29 at 196 gages, and no node is left isolated. The speedup should grow with the number of gages, to about 160× at 5,000.

Two things remain. River topology should be built offline from NHDPlus, replacing thousands of sequential web-service calls. Neighbor sampling only needs adding if full-graph passes on a GPU turn out too slow.
