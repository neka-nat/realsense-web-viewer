export type CameraParameters = {
  cameraName: string;
  depthScale: number;
  getDepthIntrinsics: (
    width: number,
    height: number
  ) =>
    | {
        offset: number[];
        focalLength: number[];
      }
    | undefined;
  getColorIntrinsics?: (
    width: number,
    height: number
  ) =>
    | {
        offset: number[];
        focalLength: number[];
      }
    | undefined;
  colorOffset: Float32Array;
  colorFocalLength: Float32Array;
  depthToColor: number[];
  colorToDepth?: number[];
  depthDistortionModel: number;
  depthDistortioncoeffs: number[];
  colorDistortionModel: number;
  colorDistortioncoeffs: number[];
};

export const getCameraParameters = (depthStream: MediaStream) => {
  const label = depthStream.getVideoTracks()[0].label;
  const cameraName = label.includes("R200")
    ? "R200"
    : label.includes("Camera S") || label.includes("SR300")
    ? "SR300"
    : label.includes("ZR300")
    ? "ZR300"
    : label.includes("415")
    ? "D415"
    : label.includes("430")
    ? "D435"
    : label.includes("435i")
    ? "D435i"
    : label.includes("435")
    ? "D435"
    : label.includes(") 4")
    ? "generic4"
    : label;

  const DistortionModel = {
    NONE: 0,
    MODIFIED_BROWN_CONRADY: 1,
    INVERSE_BROWN_CONRADY: 2,
  };

  const throwUnsupportedSizeError = (width: number, height: number) => {
    const error = new Error(
      "Depth intrinsics for size " +
        width +
        "x" +
        height +
        " are not available."
    );
    error.name = "UnsupportedSizeError";
    throw error;
  };

  const depthScaleParam = 65535;
  if (cameraName === "R200") {
    return {
      cameraName: cameraName,
      depthScale: 0.001 * depthScaleParam,
      getDepthIntrinsics: (width: number, height: number) => {
        if (width === 628 && height === 469) {
          return {
            offset: [305.558075, 233.5],
            focalLength: [582.154968, 582.154968],
          };
        } else if (width === 628 && height === 361) {
          return {
            offset: [233.3975067138671875, 179.2618865966796875],
            focalLength: [447.320953369140625, 447.320953369140625],
          };
        } else {
          throwUnsupportedSizeError(width, height);
        }
      },
      colorOffset: new Float32Array([
        311.841033935546875, 229.7513275146484375,
      ]),
      colorFocalLength: new Float32Array([
        627.9630126953125, 634.02410888671875,
      ]),
      // Rotation [0..2] goes to 1st column, [3..6] to second, etc. The
      // row at the bottom is translation.
      depthToColor: [
        0.99998325109481811523, 0.002231199527159333229, 0.00533978315070271492,
        0, -0.0021383403800427913666, 0.99984747171401977539,
        -0.017333013936877250671, 0, -0.0053776423446834087372,
        0.017321307212114334106, 0.99983555078506469727, 0,
        -0.058898702263832092285, -0.00020283895719330757856,
        -0.0001998419174924492836, 1,
      ],
      depthDistortionModel: DistortionModel.NONE,
      depthDistortioncoeffs: [0, 0, 0, 0, 0],
      colorDistortionModel: DistortionModel.MODIFIED_BROWN_CONRADY,
      colorDistortioncoeffs: [
        -0.078357703983783721924, 0.041351985186338424683,
        -0.00025565386749804019928, 0.0012357287341728806496, 0,
      ],
    };
  } else if (cameraName === "SR300 Senz3D") {
    return {
      cameraName: cameraName,
      depthScale: 0.0001249866472790017724 * depthScaleParam,
      getDepthIntrinsics: (width: number, height: number) => {
        if (width === 640 && height === 480) {
          return {
            offset: [310.743988037109375, 245.1811676025390625],
            focalLength: [475.900726318359375, 475.900726318359375],
          };
        } else {
          throwUnsupportedSizeError(width, height);
        }
      },
      getColorIntrinsics: (width: number, height: number) => {
        if (width === 640 && height === 480) {
          return {
            offset: [312.073974609375, 241.969329833984375],
            focalLength: [617.65087890625, 617.65093994140625],
          };
        } else if (width === 1280 && height === 720) {
          return {
            offset: [628.110961914062, 362.953979492188],
            focalLength: [926.476318359375, 926.476440429688],
          };
        } else if (width === 1920 && height === 1080) {
          return {
            offset: [942.166442871094, 544.430969238281],
            focalLength: [1389.71447753906, 1389.71472167969],
          };
        } else {
          throwUnsupportedSizeError(width, height);
        }
      },
      colorOffset: new Float32Array([312.073974609375, 241.969329833984375]),
      colorFocalLength: new Float32Array([617.65087890625, 617.65093994140625]),
      depthToColor: [
        0.99998641014099121094, -0.0051436689682304859161,
        0.00084982655243948101997, 0, 0.0051483912393450737,
        0.99997079372406005859, -0.005651625804603099823, 0,
        -0.00082073162775486707687, 0.0056559243239462375641,
        0.99998366832733154297, 0, 0.025699997320771217346,
        -0.00073326355777680873871, 0.0039400043897330760956, 1,
      ],
      depthDistortionModel: DistortionModel.INVERSE_BROWN_CONRADY,
      depthDistortioncoeffs: [
        0.14655706286430358887, 0.078352205455303192139,
        0.0026113723870366811752, 0.0029218809213489294052,
        0.066788062453269958496,
      ],
      colorDistortionModel: DistortionModel.NONE,
      colorDistortioncoeffs: [0, 0, 0, 0, 0],
    };
  } else if (cameraName === "SR300") {
    return {
      cameraName: cameraName,
      depthScale: 0.0001249866472790017724 * depthScaleParam,
      getDepthIntrinsics: (width: number, height: number) => {
        if (width === 640 && height === 480) {
          return {
            offset: [307.147125244141, 245.624420166016],
            focalLength: [474.499542236328, 474.499420166016],
          };
        } else {
          throwUnsupportedSizeError(width, height);
        }
      },
      getColorIntrinsics: (width: number, height: number) => {
        if (width === 640 && height === 480) {
          return {
            offset: [305.502166748047, 247.462982177734],
            focalLength: [618.239440917969, 618.239562988281],
          };
        } else if (width === 1280 && height === 720) {
          return {
            offset: [618.253234863281, 371.194458007812],
            focalLength: [927.359130859375, 927.359313964844],
          };
        } else if (width === 1920 && height === 1080) {
          return {
            offset: [927.3798828125, 556.791687011719],
            focalLength: [1391.03869628906, 1391.03894042969],
          };
        } else {
          throwUnsupportedSizeError(width, height);
        }
      },
      colorOffset: new Float32Array([305.502166748047, 247.462982177734]),
      colorFocalLength: new Float32Array([618.239440917969, 618.239562988281]),
      depthToColor: [
        0.999992787837982, -0.00343602383509278, 0.00163511745631695, 0,
        0.00344009511172771, 0.999990999698639, -0.00249356147833169, 0,
        -0.00162653462029994, 0.00249916850589216, 0.999995589256287, 0,
        0.0256999991834164, 0.00126673700287938, 0.00358582031913102, 1,
      ],
      colorToDepth: [
        0.999992787837982, -0.00343602383509278, 0.00163511745631695, 0,
        0.00344009511172771, 0.999990999698639, -0.00249356147833169, 0,
        -0.00162653462029994, 0.00249916850589216, 0.999995589256287, 0,
        -0.0257013235241175, -0.00134619453456253, -0.00354716833680868, 1,
      ],
      depthDistortionModel: DistortionModel.INVERSE_BROWN_CONRADY,
      depthDistortioncoeffs: [
        0.126395508646965, 0.0701233819127083, 0.00355594046413898,
        0.00548861175775528, 0.103697031736374,
      ],
      colorDistortionModel: DistortionModel.NONE,
      colorDistortioncoeffs: [0, 0, 0, 0, 0],
    };
  } else if (cameraName === "ZR300") {
    return {
      cameraName: cameraName,
      depthScale: 0.00100000005 * depthScaleParam,
      getDepthIntrinsics: (width: number, height: number) => {
        if (width === 628 && height === 469) {
          return {
            offset: [309.912567, 234.410904],
            focalLength: [575.72998, 575.72998],
          };
        } else if (width === 628 && height === 361) {
          return {
            offset: [238.683838, 180.205521],
            focalLength: [445.920288, 445.920288],
          };
        } else {
          throwUnsupportedSizeError(width, height);
        }
      },
      colorOffset: new Float32Array([312.271545, 233.118652]),
      colorFocalLength: new Float32Array([616.316895, 617.343323]),
      depthToColor: [
        0.999995947, 0.00140406948, 0.00246621366, 0, -0.0014070085,
        0.999998271, 0.00119038881, 0, -0.00246453821, -0.00119385391,
        0.999996245, 0, -0.0587307774, 7.03283295e-5, 0.000553227146, 1,
      ],
      depthDistortionModel: DistortionModel.NONE,
      depthDistortioncoeffs: [0, 0, 0, 0, 0],
      colorDistortionModel: DistortionModel.MODIFIED_BROWN_CONRADY,
      colorDistortioncoeffs: [
        0.0727398321, -0.138192296, 0.00080035167, 0.000444319186, 0,
      ],
    };
  } else if (cameraName === "D415") {
    return {
      cameraName: cameraName,
      depthScale: 0.00100000005 * depthScaleParam,
      getDepthIntrinsics: (width: number, height: number) => {
        if (width === 640 && height === 480) {
          return {
            offset: [315.847442626953, 241.684616088867],
            focalLength: [643.142272949219, 643.142272949219],
          };
        } else if (width === 1280 && height === 720) {
          return {
            offset: [633.771179199219, 362.526947021484],
            focalLength: [964.713439941406, 964.713439941406],
          };
        } else {
          throwUnsupportedSizeError(width, height);
        }
      },
      getColorIntrinsics: (width: number, height: number) => {
        if (width === 640 && height === 480) {
          return {
            offset: [321.308288574219, 231.349639892578],
            focalLength: [617.459838867188, 617.65087890625],
          };
        } else if (width === 1280 && height === 720) {
          return {
            offset: [641.96240234375, 347.024475097656],
            focalLength: [926.189697265625, 926.476257324219],
          };
        } else if (width === 1920 && height === 1080) {
          return {
            offset: [962.943664550781, 520.536682128906],
            focalLength: [1389.28454589844, 1389.71447753906],
          };
        } else {
          throwUnsupportedSizeError(width, height);
        }
      },
      colorOffset: new Float32Array([321.308288574219, 231.349639892578]),
      colorFocalLength: new Float32Array([617.459838867188, 617.65087890625]),
      colorToDepth: [
        0.999988317489624, -0.000426474376581609, 0.00481635145843029, 0,
        0.000353455223375931, 0.999885141849518, 0.0151513637974858, 0,
        -0.00482225976884365, -0.0151494843885303, 0.999873638153076, 0,
        -0.0150478817522526, 0.0000661657468299381, 0.000241686851950362, 1,
      ],
      depthToColor: [
        0.999988317489624, 0.000353455223375931, -0.00482225976884365, 0,
        -0.000426474376581609, 0.999885141849518, -0.0151494843885303, 0,
        0.00481635145843029, 0.0151513637974858, 0.999873638153076, 0,
        0.0150465695187449, -0.0000645012842142023, -0.00031321871210821, 1,
      ],
      depthDistortionModel: DistortionModel.NONE,
      depthDistortioncoeffs: [0, 0, 0, 0, 0],
      colorDistortionModel: DistortionModel.NONE,
      colorDistortioncoeffs: [0, 0, 0, 0, 0],
    };
  } else if (cameraName === "D435") {
    return {
      cameraName: cameraName,
      depthScale: 0.00100000005 * depthScaleParam,
      getDepthIntrinsics: (width: number, height: number) => {
        if (width === 640 && height === 480) {
          return {
            offset: [318.229400634766, 239.944534301758],
            focalLength: [381.902008056641, 381.902008056641],
          };
        } else if (width === 1280 && height === 720) {
          return {
            offset: [637.048950195312, 359.907562255859],
            focalLength: [636.503356933594, 636.503356933594],
          };
        } else {
          throwUnsupportedSizeError(width, height);
        }
      },
      getColorIntrinsics: (width: number, height: number) => {
        if (width === 640 && height === 480) {
          return {
            offset: [324.276763916016, 233.025253295898],
            focalLength: [616.862121582031, 617.127319335938],
          };
        } else if (width === 1280 && height === 720) {
          return {
            offset: [646.415161132812, 349.537872314453],
            focalLength: [925.293212890625, 925.691040039062],
          };
        } else if (width === 1920 && height === 1080) {
          return {
            offset: [969.622741699219, 524.306823730469],
            focalLength: [1387.93981933594, 1388.53649902344],
          };
        } else {
          throwUnsupportedSizeError(width, height);
        }
      },
      colorOffset: new Float32Array([324.276763916016, 233.025253295898]),
      colorFocalLength: new Float32Array([616.862121582031, 617.127319335938]),
      depthToColor: [
        0.999992370605469, 0.000624090549536049, -0.00385748990811408, 0,
        -0.000635052449069917, 0.999995768070221, -0.00284114643000066, 0,
        0.00385570037178695, 0.00284357438795269, 0.999988496303558, 0,
        0.0149379102513194, 0.000216223328607157, 0.000277608894975856, 1,
      ],
      colorToDepth: [
        0.999992370605469, -0.000635052449069917, 0.00385570037178695, 0,
        0.000624090549536049, 0.999995768070221, 0.00284357438795269, 0,
        -0.00385748990811408, -0.00284114643000066, 0.999988496303558, 0,
        -0.0149368597194552, -0.000205947319045663, -0.000335816672304645, 1,
      ],
      depthDistortionModel: DistortionModel.NONE,
      depthDistortioncoeffs: [0, 0, 0, 0, 0],
      colorDistortionModel: DistortionModel.NONE,
      colorDistortioncoeffs: [0, 0, 0, 0, 0],
    };
  } else if (cameraName === "D435i") {
    return {
      cameraName: cameraName,
      depthScale: 0.00100000005 * depthScaleParam,
      getDepthIntrinsics: (width: number, height: number) => {
        if (width === 640 && height === 480) {
          return {
            offset: [319.640411376953, 234.501083374023],
            focalLength: [383.972534179688, 383.972534179688],
          };
        } else if (width === 1280 && height === 720) {
          return {
            offset: [639.400695800781, 350.835144042969],
            focalLength: [639.954223632812, 639.954223632812],
          };
        } else {
          throwUnsupportedSizeError(width, height);
        }
      },
      getColorIntrinsics: (width: number, height: number) => {
        if (width === 640 && height === 480) {
          return {
            offset: [326.527374267578, 241.035064697266],
            focalLength: [613.288269042969, 613.207214355469],
          };
        } else if (width === 1280 && height === 720) {
          return {
            offset: [649.791015625, 361.552581787109],
            focalLength: [919.932373046875, 919.810852050781],
          };
        } else {
          throwUnsupportedSizeError(width, height);
        }
      },
      colorOffset: new Float32Array([326.527374267578, 241.035064697266]),
      colorFocalLength: new Float32Array([613.288269042969, 613.207214355469]),
      depthToColor: [
        0.999998152256012, 0.000072939285018947, -0.00191376695875078, 0,
        -0.0000624307940597646, 0.999984920024872, 0.00549048557877541, 0,
        0.00191413855645806, -0.00549035612493753, 0.999983072280884, 0,
        0.0145636992529035, 0.0000774716536398046, 0.00038804262294434, 1,
      ],
      colorToDepth: [
        0.999998152256012, -0.0000624307940597646, 0.00191413855645806, 0,
        0.000072939285018947, 0.999984920024872, -0.00549035612493753, 0,
        -0.00191376695875078, 0.00549048557877541, 0.999983072280884, 0,
        -0.0145629355683923, -0.0000786918026278727, -0.000415487680584192, 1,
      ],
      depthDistortionModel: DistortionModel.MODIFIED_BROWN_CONRADY,
      depthDistortioncoeffs: [0, 0, 0, 0, 0],
      colorDistortionModel: DistortionModel.MODIFIED_BROWN_CONRADY,
      colorDistortioncoeffs: [0, 0, 0, 0, 0],
    };
  } else if (cameraName === "generic4") {
    return {
      cameraName: cameraName,
      depthScale: 0.00100000005 * depthScaleParam,
      getDepthIntrinsics: (width: number, height: number) => {
        if (width === 640 && height === 480) {
          return {
            offset: [321.17535400390625, 248.4362640380859375],
            focalLength: [402.60308837890625, 402.60308837890625],
          };
        } else {
          throwUnsupportedSizeError(width, height);
        }
      },
      colorOffset: new Float32Array([331.870422363281, 242.991546630859]),
      colorFocalLength: new Float32Array([629.172912597656, 628.130920410156]),
      depthToColor: [
        0.999902248382, 0.010088876821, 0.009682051837, 0, -0.010075648315,
        0.9999482631683, -0.001414125669, 0, 0.009695817716, 0.00131643447,
        0.99995213747, 0, 0.036090422422, 0.000611198542174, -0.00184865354, 1,
      ],
      depthDistortionModel: DistortionModel.NONE,
      depthDistortioncoeffs: [0, 0, 0, 0, 0],
      colorDistortionModel: DistortionModel.NONE,
      colorDistortioncoeffs: [0, 0, 0, 0, 0],
    };
  } else {
    console.error("Sorry, your camera '" + cameraName + "' is not supported");
    return undefined;
  }
};
