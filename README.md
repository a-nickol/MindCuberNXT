MindCuber NXT – GAN 356 RS Edition
==================================

This is a fork of [dlech/MindCuberNXT](https://github.com/dlech/MindCuberNXT),
which contains David Gilday's original MindCuber source code for LEGO
MINDSTORMS NXT. This fork adapts MindCuber so that it can solve the
**GAN 356 RS 3x3 stickerless speed cube** instead of a standard Rubik's Cube.

Improvements in this fork
-------------------------

- **Support for the GAN 356 RS stickerless speed cube**
  The GAN cube is smaller (56 mm) than a standard Rubik's Cube, so the color
  sensor missed the tiles at the original scan positions. The sensor arm
  positions for the NXT 2.0 variant were re-tuned in `MindCuber.nxc`:

  | Constant | Meaning                  | Original | GAN 356 RS |
  |----------|--------------------------|---------:|-----------:|
  | `T_SCNR` | sensor position, corners |      103 |         80 |
  | `T_SEDG` | sensor position, edges   |       87 |         60 |

- **3D-printable centering adapter**
  `gan356_centering_adapter.scad` (OpenSCAD source) and
  `gan356_centering_adapter.stl` (ready to print) describe an insert for the
  cube tray. Its funnel shape guides the smaller cube into the center and
  holds it firmly in position, so every scan and turn hits the cube at the
  same spot. The main dimensions are parameters at the top of the SCAD file
  and can be adjusted for other cube sizes.

- **NXT 2.0 variant as default**
  `NXT_8527` is disabled again, so the code builds for the standard NXT 2.0
  version of MindCuber out of the box.

- **Color scan logging enabled**
  `LOG` is defined by default. During each scan the robot writes the raw and
  processed sensor values to `mc.log` on the NXT.

- **Log analyzer (`analyze_log.js`)**
  A Node.js script that reads `mc.log`, re-implements MindCuber's color
  classification and replays it for all six discrimination heuristics. It
  reports:
  - ambient light level seen by the sensor,
  - the lightness spread per face (a hint for mechanical positioning issues),
  - which faces / tiles were classified as which color,
  - which edges and corners could not be matched to a valid cube,
  - the measured RGB/HSL values of the six face centers and practical
    tips for glare and lighting problems.

- **Calibration reader (`read_mccfg.ps1`)**
  A PowerShell script that decodes the white balance multipliers stored in
  `mccfg.dat` and warns if the calibration looks wrong (e.g. when a colored
  face instead of the white face was used for calibration).

- **Sample data**
  `mc.log` and `mccfg.dat` from real runs with the GAN 356 RS are included,
  so the analysis tools can be tried out right away.

Analyzing a scan
----------------

1. Run MindCuber on the NXT with `LOG` enabled.
2. Copy `mc.log` (and optionally `mccfg.dat`) from the NXT into this folder,
   for example with the NXT Explorer in BricxCC (Tools/NXT Explorer).
3. Run the analyzer and the calibration reader:

        node analyze_log.js
        .\read_mccfg.ps1

Files
-----

| File                            | Description                                   |
|---------------------------------|-----------------------------------------------|
| `MindCuber.nxc`                 | Main NXC program (tuned for the GAN 356 RS)   |
| `mcmoves.h`                     | Move lookup tables (unchanged)                |
| `gan356_centering_adapter.scad` | OpenSCAD source of the centering adapter      |
| `gan356_centering_adapter.stl`  | Printable STL of the centering adapter        |
| `analyze_log.js`                | Log and color classification analyzer         |
| `read_mccfg.ps1`                | Reader for the white balance calibration file |
| `mc.log`, `mccfg.dat`           | Sample log and calibration data               |

---

Original MindCuber README
========================

By David Gilday

Copyright (C) 2011-2013 David Gilday

http://mindcuber.com

Release Information: v2.2

Release History:  
 - v2.2 - 13th July 2013, include support for cubes with black stickers  
 - v2.1 - 22nd June 2013, initial public release

Usage:
-----

  This software may be used for any non-commercial purpose providing
  that the original author is acknowledged.

Disclaimer:
----------

  This software is provided 'as is' without warranty of any kind, either
  express or implied, including, but not limited to, the implied warranties
  of fitness for a purpose, or the warranty of non-infringement.

Description:
-----------

MindCuber is a robot that can be built from LEGO MINDSTORMS NXT to solve a
Rubik's Cube.

This release includes source code for MindCuber that can be compiled for both
the NXT 2.0 variant and for the "Orange Box" #8527 variant. The source may also
be configured to allow MindCuber to "solve" the cube to one or more patterns
rather than the normal solved state.

Using BricxCC:
-------------

1. Install BricxCC on your computer (see notes below for link)

2. Open BricxCC

3. Open the menu Edit/Preferences..., select the NBC/NXC tab and
   set the preferences recommended in the notes below

4. Use menu Tools/Find Brick... to connect to the NXT

5. Use the menu File/Open... to open the MindCuber.nxc source file

6. If you wish to compile for the #8257 variant of MindCuber, remove the
   comment characters from the line in MindCuber.rxe that says:

        //#define NXT_8527
    
    to say:

        #define NXT_8527

7. Select menu Compile/Download and Run to compile the program, download
   it to the NXT and run

The source includes some other options for creating patterns by uncommenting
other lines near the top of the MindCuber.nxc.

The source includes options to solve cubes with black stickers rather than
white. Uncomment one or both of the following lines as appropriate:

    //#define BLACK_FACE
    //#define WHITE_LOGO

The option for using the HiTechnic v2 color sensor as an alternative to the
LEGO color sensor has not been tested so may need some additional work.

Please see http://mindcuber.com for further information.

Notes:
-----

MindCuber.nxc can be compiled with Bricx Command Center (BricxCC) available 
from: http://sourceforge.net/projects/bricxcc/files/bricxcc and has been
tested with BricxCC version 3.3 (Build 3.3.8.9)

The compiled program, MindCuber.rxe, will run on standard LEGO MINDSTORMS NXT
firmware and has been tested with version 1.31

The MindCuber program uses almost all of the available memory in the NXT so
any changes to the code which increase its' size may cause issues. The choice
of firmware on the NXT may affect how much memory is available so other versions
of the NXT firmware may also cause issues.

BricxCC preferences for compiling with NBC/NXC:
  + nbc-1.2.1r4
  + NXT 2.0 compatible firmware
  + Automatic firmware version
  + Optimization level 2

Not tested with:
  - internal compiler
  - enahanced firmware
