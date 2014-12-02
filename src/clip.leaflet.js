"use strict";

var Polygon = require('./polygon');

function op(s, c) {
    if (s && c) {
        return 'intersection';
    } else if (!(s && c)) {
        return 'union';
    } else {
        return 'diff';
    }
}

/**
 * Clip driver
 * @api
 * @param  {L.Polygon} A
 * @param  {L.Polygon} B
 * @param  {Boolean} sourceForwards
 * @param  {Boolean} clipForwards
 * @return {Array.<L.LatLng>|null}
 */
module.exports = function leafletClip(A, B, sourceForwards, clipForwards) {
    console.group(op(sourceForwards, clipForwards));
    console.group('hulls');
    A._holes.forEach(function(h) {
        h[0].h = true;
    });

    B._holes.forEach(function(h) {
        h[0].h = true;
    });

    var hullsResult = _clip(
        A['_latlngs'].concat([].concat.apply([], A['_holes'])),
        B['_latlngs'].concat([].concat.apply([], B['_holes'])),
        sourceForwards, clipForwards);
    console.log('hulls result', JSON.stringify(hullsResult));

    return toLatLngs(hullsResult);

    console.groupEnd('hulls');

    var holesLength, holes, holeResult;

    console.log(sourceForwards, clipForwards)
    if (sourceForwards ^ clipForwards) {
        console.log(new Polygon(fromLatLngs(A['_latlngs'])).getPoints());
        hullsResult.push(new Polygon(fromLatLngs(A['_latlngs'])).getPoints())
        holesLength = (B['_holes'] ? B['_holes'].length : 0);
        holes = B['_holes'] || [];
        hullsResult.map(function(hull) {
            new Polygon(hull).clip()
        });
    } else {
        holesLength = (A['_holes'] ? A['_holes'].length : 0) +
            (B['_holes'] ? B['_holes'].length : 0);
        holes = (A['_holes'] || []).concat(B['_holes'] || []);
    }

    console.log('hulls', JSON.stringify(hullsResult))

    if (holesLength !== 0) {
        for (var j = 0, len = hullsResult.length; j < len; j++) {
            var source = new Polygon(hullsResult[j]),
                holeResult = [];
            for (var i = 0; i < holesLength; i++) {
                var clipped = source.clip(
                    new Polygon(fromLatLngs(holes[i])), !sourceForwards, clipForwards
                );
                console.log('clipped', clipped, !sourceForwards, clipForwards);
                if (clipped) {
                    holeResult = holeResult.concat(clipped);
                    console.log('holes removed', holeResult);
                }
            }
            if (holeResult && holeResult.length !== 0) {
                hullsResult[j] = holeResult;
                if (!(sourceForwards || clipForwards)) {
                    hullsResult[j].unshift(source.getPoints());
                }
            }
        }
    }

    console.log('got', JSON.stringify(hullsResult))
    console.groupEnd(op(sourceForwards, clipForwards));
    return formatResult(hullsResult);
};

function _clip(A, B, sourceForwards, clipForwards) {
    var source = [],
        clip = [],
        i, len;

    source = new Polygon(fromLatLngs(A));
    clip = new Polygon(fromLatLngs(B));

    return source.clip(clip, sourceForwards, clipForwards);
}

function formatResult(result) {
    if (result.length > 0) {
        for (var i = 0, len = result.length; i < len; i++) {
            result[i] = toLatLngs(result[i]);
        }

        return result;
    } else {
        return null;
    }
}

function fromLatLngs(latlngs) {
    var pts = [];
    for (var i = 0, len = latlngs.length; i < len; i++) {
        pts.push([latlngs[i]['lng'], latlngs[i]['lat']]);
        if (latlngs[i].h) {
            pts[pts.length - 1].h = true;
        }
    }
    return pts;
};

function toLatLngs(poly) {
    console.log(poly)
    if (poly[0].length && typeof poly[0][0] !== 'number') {
        var result = [];
        for (var i = 0, len = poly.length; i < len; i++) {
            result.push(_toLatLngs(poly[i]));
        }
        return result;
    } else {
        return _toLatLngs(poly);
    }
}

function _toLatLngs(poly) {
    var result = poly;

    if (result) {
        if (result[0][0] === result[result.length - 1][0] &&
            result[0][1] === result[result.length - 1][1]) {
            result = result.slice(0, result.length - 1);
        }

        for (var i = 0, len = result.length; i < len; i++) {
            result[i] = [result[i][1], result[i][0]];
        }
        return result;
    } else {
        return null;
    }
}