// Centering adapter for MindCuber
// Insert for the MindCuber cube tray that keeps the smaller
// GAN 356 RS 3x3 (56 mm) speed cube centered and held firmly in position.
// All dimensions in mm

outer        = 64.6;  // slightly smaller than 65 so it fits into the tray
height       = 12;
floor_thick  = 1.5;   // 0 = no floor
inner_bottom = 57;    // cube 56 + 1 mm clearance
inner_top    = 63;    // funnel opening
chamfer      = 2;     // additional lead-in chamfer at the top
corner_relief = 3;    // relief for the cube corners

$fn = 32;

difference() {
    // Base body
    translate([-outer/2, -outer/2, 0])
        cube([outer, outer, height]);

    // Funnel
    hull() {
        translate([-inner_bottom/2, -inner_bottom/2, floor_thick])
            cube([inner_bottom, inner_bottom, 0.01]);
        translate([-inner_top/2, -inner_top/2, height - chamfer])
            cube([inner_top, inner_top, 0.01]);
    }

    // Lead-in chamfer at the top
    hull() {
        translate([-inner_top/2, -inner_top/2, height - chamfer])
            cube([inner_top, inner_top, 0.01]);
        translate([-(outer-1)/2, -(outer-1)/2, height])
            cube([outer-1, outer-1, 0.01]);
    }

    // Corner reliefs so the cube corners do not get caught
    for (x = [-1, 1], y = [-1, 1])
        translate([x*inner_bottom/2, y*inner_bottom/2, floor_thick])
            cylinder(r = corner_relief/2, h = height);
}
