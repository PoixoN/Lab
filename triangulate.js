var Point = function (x, y) {
    this.x = x;
    this.y = y;
};

var radius = 5; delta = new Point(-20, 20);

function drawTrianguletion() {
    points = updatePoints();
    hull = grahamsScan(points);
    internal_points = points.map((_, i) => i).filter(function (cv) { return !hull.includes(cv) });
    edges = hull.map((cv, i) => [cv, hull[(i + 1) % hull.length]]);
    drawGraph(points, edges, document.getElementById('canvas-points'), true);
    drawGraph(points, edges, document.getElementById('canvas-hull'), false);
    hulltriangles = triangulatePoints(points, hull);

    alltriangles = triangulateInternalPoints(points, hulltriangles, internal_points);

    alledges = [];
    for (t of alltriangles) {
        _t = (t[0] < t[1]) ? [t[0], t[1]] : [t[1], t[0]]; if (!alledges.includes(_t)) alledges.push(_t);
        _t = (t[1] < t[2]) ? [t[1], t[2]] : [t[2], t[1]]; if (!alledges.includes(_t)) alledges.push(_t);
        _t = (t[2] < t[0]) ? [t[2], t[0]] : [t[0], t[2]]; if (!alledges.includes(_t)) alledges.push(_t);
    };
    alledges1 = alledges.slice();
    drawGraph(points, alledges, document.getElementById('canvas-triang'), false);
}

function generatePoints() {
    const neededPointsInput = document.getElementById('neededPointsAmount');
    let neededPointsAmount = parseInt(neededPointsInput.value);

    if (neededPointsAmount) {
        neededPointsAmount = neededPointsAmount * 2;
    }
    else {
        neededPointsInput.value = 6;
        neededPointsAmount = 12;
    }

    var currentPoints = document.getElementById('points');

    let res = [];
    for (let i = 1; i <= neededPointsAmount; i++) {
        res.push(Math.floor(Math.random() * 180) + 1);
    }

    currentPoints.value = res.join(', ');
}

function updatePoints(point = undefined) {
    _points = document.getElementById('points');
    points_list = getPoints(_points);
    if (point) {
        near_points = false;
        for (i = 0; i < points_list.length; i++) {
            p = points_list[i];
            near_points = near_points || skalValue(p, point, point) <= radius * radius;
            if (near_points) break;
        };
        if (near_points) {
            points_list.splice(i, 1);
        }
        else {
            points_list.push(point);
        }
    };

    points = [...(new Set(points_list))].sort((a, b) => (a.x < b.x || (a.x == b.x && a.y > b.y) ? -1 : 1));

    document.getElementById('points').value = points.map(p => [p.x, p.y].join(', ')).join(', ');
    return points;
};

function getPoints(pointsString) {
    _points = pointsString.value.split(", ");
    points = [];
    for (i = 0; i < _points.length; i += 2) {
        points.push(new Point(parseInt(_points[i]), parseInt(_points[i + 1])));
    };
    return points;
};

function determinant(p0, p1, p2) {
    return (p2.x - p0.x) * (p1.y - p0.y) - (p2.y - p0.y) * (p1.x - p0.x);
}

function skalValue(p0, p1, p2) {
    return (p2.x - p0.x) * (p1.x - p0.x) + (p2.y - p0.y) * (p1.y - p0.y);
}

function pointInTriangle(points, pt) {
    for (i = 0; i < 4; i++)
        pt[i] = points[pt[i]];

    a = determinant(pt[3], pt[1], pt[2]);
    b = determinant(pt[0], pt[3], pt[2]);
    c = determinant(pt[0], pt[1], pt[3]);

    return a <= 0 && b <= 0 && c <= 0;
}

function grahamsScan(points) {
    n = points.length;

    if (n < 3) return;

    l = 0;
    hull = [];
    p = l;
    q = 0;

    while (true) {
        hull.push(p);
        q = (p + 1) % n;

        for (i = 0; i < n; i++)
            if (determinant(points[p], points[i], points[q]) < 0)
                q = i;

        p = q;

        if (p == l) break;
    };

    return hull;
};

function triangulatePoints(points, indexes) {
    count = indexes.length;
    var triangles = [];
    if (count < 3) {
        return triangles;
    }
    else if (count == 3) {
        triangles.push([indexes[0], indexes[1], indexes[2]]);
        return triangles;
    }

    for (var i = 0; i < count; i++) {
        var ind0 = indexes[i]; var ind1 = indexes[(i + 1) % count]; var ind2 = indexes[(i + 2) % count];
        p0 = points[ind0];
        p1 = points[ind1];
        p2 = points[ind2];
        _det = determinant(p0, p1, p2);

        if (_det > 0) continue;

        var maxj = i + 2;
        var maxcos2 = 0;
        for (var j = i + 3; j < count; j++) {
            ind3 = indexes[j]
            p3 = points[ind3];

            a = determinant(p3, p1, p2) / _det; b = determinant(p0, p3, p2) / _det; c = determinant(p0, p1, p3) / _det;

            if (a < 0 || b < 0 || c < 0) continue;

            _skal = skalValue(p0, p1, p3);
            cos2 = _skal * _skal / (skalValue(p0, p1, p1) * skalValue(p0, p3, p3));

            if (cos2 > maxcos2) {
                maxj = j; maxind3 = indexes[maxj]; maxcos2 = cos2;
            };
        }
        if (maxcos2 == 0) {
            triangles.push([ind0, ind1, ind2]);
            triangles1 = triangulatePoints(points, indexes.slice(i + 2).concat(indexes.slice(0, i + 1)));
            return triangles.concat(triangles1);
        }
        else {
            triangles.push([ind0, ind1, maxind3]);
            triangles1 = triangulatePoints(points, indexes.slice(i + 1, maxj + 1));
            triangles2 = triangulatePoints(points, indexes.slice(maxj).concat(ind0));
            return triangles.concat(triangles1, triangles2);
        }
    }

    return;
}

function triangulateInternalPoints(points, triangles, internal_points) {
    for (var i = 0; i < internal_points.length; i++) {
        p = internal_points[i];
        len = triangles.length;
        for (var j = 0; j < len; j++) {
            t = triangles[j];
            if (pointInTriangle(points, [t[0], t[1], t[2], p])) {
                triangles.splice(j, 1, [p, t[1], t[2]], [t[0], p, t[2]], [t[0], t[1], p]);
                break;
            };
        };
    };

    return triangles;
}

function canvasClear(canvas) {
    ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawCircle(ctx, center, text) {
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeText(text + '(' + center.x.toFixed(0) + ',' + center.y.toFixed(0) + ')',
        center.x + delta.x, center.y + delta.y);
}

function drawGraph(points, edges, canvas, only = true) {
    len = points.length;

    if (len == 0) return;

    canvasClear(canvas);

    ctx = canvas.getContext('2d');
    ctx.fillStyle = '#007bff';
    ctx.font = "12px Arial";

    drawCircle(ctx, points[len - 1], len - 1);

    for (d in points) {
        drawCircle(ctx, points[d], d);
    };

    ctx.fill();

    if (only || edges.length == 0) return;

    for (d in edges) {
        left = edges[d][0]; right = edges[d][1];
        ctx.moveTo(points[left].x, points[left].y);
        ctx.lineTo(points[right].x, points[right].y);
    }

    ctx.stroke();
};

