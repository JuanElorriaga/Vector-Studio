/**
 * Vector Studio - SVG Vector Graphics Engine
 * CorelDRAW Inspired Suite: Selection, Bézier Curve, Right-Angle Round Connector, Straight Connector, Basic Shapes.
 */

(function () {
  'use strict';

  // State Management
  const state = {
    tool: 'select', // 'select' | 'bezier' | 'connector-round' | 'line' | 'rect' | 'circle' | 'polygon' | 'pan'
    zoom: 1,
    pan: { x: 80, y: 50 },
    isPanning: false,
    panStart: { x: 0, y: 0 },
    spacePressed: false,
    gridVisible: true,
    snapToGrid: false,
    gridSize: 20,
    selectedId: null,
    selectedNodeIndex: null, // For Bézier path node selection
    nextId: 1,
    colorTarget: 'fill', // 'fill' | 'stroke'
    history: [],
    historyIndex: -1,
    isDrawing: false,
    drawStart: { x: 0, y: 0 },
    transforming: null,
    bezierDraft: null, // { points: [{x, y, cp1, cp2, smooth}], closed: false }
    docWidth: 1200,
    docHeight: 800,
    elements: new Map(), // id -> element data object
    lockAspectRatio: true,
    // Mobile Touch & Multi-Touch Gestures
    touchStartDist: 0,
    touchStartZoom: 1,
    touchStartMid: { x: 0, y: 0 },
    touchStartPan: { x: 0, y: 0 },
    isMultiTouch: false
  };

  // DOM Elements Cache
  const dom = {
    app: document.getElementById('app'),
    viewport: document.getElementById('canvas-viewport'),
    wrapper: document.getElementById('canvas-wrapper'),
    svg: document.getElementById('drawing-svg'),
    svgDefs: document.getElementById('svg-defs'),
    canvasGrid: document.getElementById('canvas-grid'),
    shapesLayer: document.getElementById('shapes-layer'),
    previewLayer: document.getElementById('preview-layer'),
    selectionLayer: document.getElementById('selection-layer'),
    docTitle: document.getElementById('doc-title'),
    zoomValue: document.getElementById('zoom-value'),
    canvasStatus: document.getElementById('canvas-status'),
    toast: document.getElementById('toast'),

    // Document Dimensions Controls
    topDocW: document.getElementById('top-doc-w'),
    topDocH: document.getElementById('top-doc-h'),
    docPresetSelect: document.getElementById('doc-preset-select'),
    sideDocW: document.getElementById('side-doc-w'),
    sideDocH: document.getElementById('side-doc-h'),
    btnDocFit: document.getElementById('btn-doc-fit'),

    // Inspector
    inspectorEmpty: document.getElementById('inspector-empty'),
    inspectorActive: document.getElementById('inspector-active'),
    selectedBadge: document.getElementById('selected-type-badge'),

    // Special Actions
    btnConvertShape: document.getElementById('btn-convert-shape'),
    btnConvertText: document.getElementById('btn-convert-text'),
    
    // Line Curvature
    rowCurveLine: document.getElementById('row-curve-line'),
    btnToggleCurve: document.getElementById('btn-toggle-curve'),
    btnCurveText: document.getElementById('btn-curve-text'),
    rowCurveAmount: document.getElementById('row-curve-amount'),
    curveAmountSlider: document.getElementById('curve-amount-slider'),
    curveAmountVal: document.getElementById('curve-amount-val'),
    btnCurveStraight: document.getElementById('btn-curve-straight'),
    btnCurveArch: document.getElementById('btn-curve-arch'),
    btnCurveInv: document.getElementById('btn-curve-inv'),

    // Conector Redondo de Ângulo Reto
    rowConnectorRound: document.getElementById('row-connector-round'),
    connectorRoundSlider: document.getElementById('connector-round-slider'),
    connectorRoundVal: document.getElementById('connector-round-val'),
    btnElbow0: document.getElementById('btn-elbow-0'),
    btnElbow16: document.getElementById('btn-elbow-16'),
    btnElbow32: document.getElementById('btn-elbow-32'),
    btnToggleElbowDir: document.getElementById('btn-toggle-elbow-dir'),

    // Bézier Path & Node Manipulation
    rowBezier: document.getElementById('row-bezier'),
    btnToggleBezierClosed: document.getElementById('btn-toggle-bezier-closed'),
    btnBezierClosedText: document.getElementById('btn-bezier-closed-text'),
    bezierNodePanel: document.getElementById('bezier-node-panel'),
    bezierSelectedNodeLabel: document.getElementById('bezier-selected-node-label'),
    bezierNodeStatus: document.getElementById('bezier-node-status'),
    btnBezierCurveNode: document.getElementById('btn-bezier-curve-node'),
    btnBezierStraightenNode: document.getElementById('btn-bezier-straighten-node'),
    btnBezierSmoothNode: document.getElementById('btn-bezier-smooth-node'),
    btnBezierDeleteNode: document.getElementById('btn-bezier-delete-node'),

    // Corners & Vertices
    rowCorners: document.getElementById('row-corners'),
    cornerRadiusSlider: document.getElementById('corner-radius-slider'),
    cornerRadiusVal: document.getElementById('corner-radius-val'),
    btnCorner0: document.getElementById('btn-corner-0'),
    btnCorner12: document.getElementById('btn-corner-12'),
    btnCornerMax: document.getElementById('btn-corner-max'),
    rowPolyPoints: document.getElementById('row-poly-points'),
    polyPointsSlider: document.getElementById('poly-points-slider'),
    polyPointsVal: document.getElementById('poly-points-val'),
    btnPolyDec: document.getElementById('btn-poly-dec'),
    btnPolyInc: document.getElementById('btn-poly-inc'),

    // Dimensions
    propX: document.getElementById('prop-x'),
    propY: document.getElementById('prop-y'),
    propW: document.getElementById('prop-w'),
    propH: document.getElementById('prop-h'),
    propRotation: document.getElementById('prop-rotation'),
    propRotationVal: document.getElementById('prop-rotation-val'),

    // Flip and Scale
    btnFlipH: document.getElementById('btn-flip-h'),
    btnFlipV: document.getElementById('btn-flip-v'),
    btnLockAspect: document.getElementById('btn-lock-aspect'),
    aspectLockText: document.getElementById('aspect-lock-text'),
    btnScaleHalf: document.getElementById('btn-scale-half'),
    btnScaleMinus: document.getElementById('btn-scale-minus'),
    btnScalePlus: document.getElementById('btn-scale-plus'),
    btnScaleDouble: document.getElementById('btn-scale-double'),
    propScaleInput: document.getElementById('prop-scale-input'),
    btnScaleApply: document.getElementById('btn-scale-apply'),

    // Fill
    fillModeSolid: document.getElementById('fill-mode-solid'),
    fillModeGradient: document.getElementById('fill-mode-gradient'),
    fillModeNone: document.getElementById('fill-mode-none'),
    fillSolidControls: document.getElementById('fill-solid-controls'),
    fillGradientControls: document.getElementById('fill-gradient-controls'),
    propFillColor: document.getElementById('prop-fill-color'),
    propFillColorHex: document.getElementById('prop-fill-color-hex'),
    propFillOpacity: document.getElementById('prop-fill-opacity'),

    // Gradient
    gradientPreviewBar: document.getElementById('gradient-preview-bar'),
    gradStop1Color: document.getElementById('grad-stop1-color'),
    gradStop1Hex: document.getElementById('grad-stop1-hex'),
    gradStop2Color: document.getElementById('grad-stop2-color'),
    gradStop2Hex: document.getElementById('grad-stop2-hex'),
    gradAngleSlider: document.getElementById('grad-angle-slider'),
    gradAngleVal: document.getElementById('grad-angle-val'),
    gradAngleWrapper: document.getElementById('grad-angle-wrapper'),

    // Stroke
    propStrokeColor: document.getElementById('prop-stroke-color'),
    propStrokeColorHex: document.getElementById('prop-stroke-color-hex'),
    propStrokeWidth: document.getElementById('prop-stroke-width'),
    propStrokeDash: document.getElementById('prop-stroke-dash'),
    propStrokeCap: document.getElementById('prop-stroke-cap'),
    btnToggleStroke: document.getElementById('btn-toggle-stroke'),

    // Arrange buttons
    btnBringFront: document.getElementById('btn-bring-front'),
    btnSendBack: document.getElementById('btn-send-back'),
    btnDuplicate: document.getElementById('btn-duplicate'),
    btnDelete: document.getElementById('btn-delete'),

    // Topbar buttons
    btnUndo: document.getElementById('btn-undo'),
    btnRedo: document.getElementById('btn-redo'),
    btnZoomIn: document.getElementById('btn-zoom-in'),
    btnZoomOut: document.getElementById('btn-zoom-out'),
    btnZoomFit: document.getElementById('btn-zoom-fit'),
    btnToggleGrid: document.getElementById('btn-toggle-grid'),
    btnToggleSnap: document.getElementById('btn-toggle-snap'),
    btnClearCanvas: document.getElementById('btn-clear-canvas'),
    fileInput: document.getElementById('file-input'),
    btnExportSvg: document.getElementById('btn-export-svg'),
    btnExportMore: document.getElementById('btn-export-more'),
    exportMenu: document.getElementById('export-menu'),
    btnExportSvgDirect: document.getElementById('btn-export-svg-direct'),
    btnExportPng: document.getElementById('btn-export-png'),
    btnSaveProject: document.getElementById('btn-save-project'),

    // Bottom Palette
    btnTargetFill: document.getElementById('btn-target-fill'),
    btnTargetStroke: document.getElementById('btn-target-stroke'),
    quickCustomColor: document.getElementById('quick-custom-color'),

    // Text Tool Elements
    toolText: document.getElementById('tool-text'),
    rowTextProps: document.getElementById('row-text-props'),
    propTextContent: document.getElementById('prop-text-content'),
    propFontFamily: document.getElementById('prop-font-family'),
    propFontSizeInput: document.getElementById('prop-font-size-input'),
    propFontSizeSlider: document.getElementById('prop-font-size-slider'),
    btnFont24: document.getElementById('btn-font-24'),
    btnFont48: document.getElementById('btn-font-48'),
    btnFont72: document.getElementById('btn-font-72'),
    btnFont96: document.getElementById('btn-font-96'),
    btnTextBold: document.getElementById('btn-text-bold'),
    btnTextItalic: document.getElementById('btn-text-italic'),
    btnAlignLeft: document.getElementById('btn-align-left'),
    btnAlignCenter: document.getElementById('btn-align-center'),
    btnAlignRight: document.getElementById('btn-align-right'),

    // Mobile Elements
    inspectorPanel: document.getElementById('inspector-panel'),
    btnCloseInspector: document.getElementById('btn-close-inspector'),
    btnMobileInspector: document.getElementById('btn-mobile-inspector'),
    mobileInspectorBtnText: document.getElementById('mobile-inspector-btn-text'),
    btnMobileInspectorToggle: document.getElementById('btn-mobile-inspector-toggle'),
    mobileSelectedDot: document.getElementById('mobile-selected-dot'),
    mobileMenuSheet: document.getElementById('mobile-menu-sheet'),
    mobileSheetBackdrop: document.getElementById('mobile-sheet-backdrop'),
    btnMobileMenuToggle: document.getElementById('btn-mobile-menu-toggle'),
    btnCloseMobileMenu: document.getElementById('btn-close-mobile-menu'),
    mobileDocTitle: document.getElementById('mobile-doc-title'),
    mobileDocW: document.getElementById('mobile-doc-w'),
    mobileDocH: document.getElementById('mobile-doc-h'),
    btnMobileExportSvg: document.getElementById('btn-mobile-export-svg'),
    btnMobileExportPng: document.getElementById('btn-mobile-export-png'),
    btnMobileSaveJson: document.getElementById('btn-mobile-save-json'),
    mobileFileInput: document.getElementById('mobile-file-input'),
    btnMobileClear: document.getElementById('btn-mobile-clear')
  };

  // Initialize
  function init() {
    setupViewportTransform();
    setupEventListeners();
    setupPalette();
    saveHistoryState();
    updateUI();
    showToast('Vector Studio pronto para desenhar!');
  }

  // =========================================================================
  // VIEWPORT & ZOOM / PAN CONTROLS
  // =========================================================================

  function setupViewportTransform() {
    const rect = dom.viewport.getBoundingClientRect();
    state.pan.x = Math.max(30, (rect.width - state.docWidth) / 2);
    state.pan.y = Math.max(30, (rect.height - state.docHeight) / 2);
    applyTransform();
  }

  function applyTransform() {
    dom.wrapper.style.transform = `translate(${state.pan.x}px, ${state.pan.y}px) scale(${state.zoom})`;
    dom.zoomValue.textContent = `${Math.round(state.zoom * 100)}%`;
  }

  function setDocumentDimensions(w, h, skipHistory = false) {
    w = Math.max(50, Math.min(10000, Math.round(parseFloat(w) || 1200)));
    h = Math.max(50, Math.min(10000, Math.round(parseFloat(h) || 800)));

    state.docWidth = w;
    state.docHeight = h;

    dom.svg.setAttribute('width', w);
    dom.svg.setAttribute('height', h);
    dom.svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

    if (dom.canvasStatus) dom.canvasStatus.textContent = `${w} × ${h} px`;
    if (dom.topDocW && dom.topDocW.value != w) dom.topDocW.value = w;
    if (dom.topDocH && dom.topDocH.value != h) dom.topDocH.value = h;
    if (dom.sideDocW && dom.sideDocW.value != w) dom.sideDocW.value = w;
    if (dom.sideDocH && dom.sideDocH.value != h) dom.sideDocH.value = h;

    if (dom.docPresetSelect) {
      const val = `${w}x${h}`;
      let matched = false;
      for (let i = 0; i < dom.docPresetSelect.options.length; i++) {
        if (dom.docPresetSelect.options[i].value === val) {
          dom.docPresetSelect.selectedIndex = i;
          matched = true;
          break;
        }
      }
      if (!matched) {
        dom.docPresetSelect.value = '';
      }
    }

    renderSelectionOverlay();

    if (!skipHistory) {
      saveHistoryState();
      showToast(`Dimensões do documento: ${w} × ${h} px`);
    }
  }

  function setZoom(newZoom, centerX = null, centerY = null) {
    const minZoom = 0.15;
    const maxZoom = 10;
    newZoom = Math.min(maxZoom, Math.max(minZoom, newZoom));

    if (centerX !== null && centerY !== null) {
      const currentScale = state.zoom;
      const mouseX = centerX - state.pan.x;
      const mouseY = centerY - state.pan.y;
      state.pan.x = centerX - (mouseX / currentScale) * newZoom;
      state.pan.y = centerY - (mouseY / currentScale) * newZoom;
    } else {
      const rect = dom.viewport.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const mouseX = cx - state.pan.x;
      const mouseY = cy - state.pan.y;
      state.pan.x = cx - (mouseX / state.zoom) * newZoom;
      state.pan.y = cy - (mouseY / state.zoom) * newZoom;
    }

    state.zoom = newZoom;
    applyTransform();
  }

  function zoomFit() {
    const rect = dom.viewport.getBoundingClientRect();
    const margin = 40;
    const scaleX = (rect.width - margin * 2) / state.docWidth;
    const scaleY = (rect.height - margin * 2) / state.docHeight;
    const fitZoom = Math.min(scaleX, scaleY, 1.2);
    state.zoom = fitZoom;
    state.pan.x = (rect.width - state.docWidth * fitZoom) / 2;
    state.pan.y = (rect.height - state.docHeight * fitZoom) / 2;
    applyTransform();
  }

  function clientToSvgCoords(clientX, clientY) {
    const pt = dom.svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = dom.svg.getScreenCTM();
    if (ctm) {
      const inverse = ctm.inverse();
      const svgPoint = pt.matrixTransform(inverse);
      let x = svgPoint.x;
      let y = svgPoint.y;
      if (state.snapToGrid) {
        x = Math.round(x / state.gridSize) * state.gridSize;
        y = Math.round(y / state.gridSize) * state.gridSize;
      }
      return { x, y };
    }
    const rect = dom.svg.getBoundingClientRect();
    let x = (clientX - rect.left) / state.zoom;
    let y = (clientY - rect.top) / state.zoom;
    if (state.snapToGrid) {
      x = Math.round(x / state.gridSize) * state.gridSize;
      y = Math.round(y / state.gridSize) * state.gridSize;
    }
    return { x, y };
  }

  // =========================================================================
  // TOOL SELECTION
  // =========================================================================

  function setTool(toolName) {
    // If we were drawing a Bézier curve and switched tools without completing:
    if (state.tool === 'bezier' && state.bezierDraft && state.bezierDraft.points.length > 1) {
      finishBezierDraft();
    } else {
      cancelBezierDraft();
    }

    state.tool = toolName;
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tool === toolName);
    });

    dom.viewport.classList.toggle('panning', toolName === 'pan');

    if (toolName !== 'select') {
      renderSelectionOverlay();
    }
  }

  // =========================================================================
  // SHAPE FACTORIES & DATA MODELS
  // =========================================================================

  function createNewShape(type, startX, startY) {
    const id = `shape_${state.nextId++}`;
    const defaultColor = '#3b82f6';
    const defaultStroke = '#ffffff';

    const baseData = {
      id,
      type, // 'rect' | 'circle' | 'line' | 'polygon' | 'connector-round' | 'bezier'
      x: startX,
      y: startY,
      width: 0,
      height: 0,
      rotation: 0,
      flipH: false,
      flipV: false,
      fillType: 'solid',
      fillColor: defaultColor,
      fillOpacity: 1,
      gradient: {
        type: 'linear',
        angle: 90,
        stop1: '#4f46e5',
        stop2: '#06b6d4',
        id: `grad_${id}`
      },
      strokeColor: defaultStroke,
      strokeWidth: 3,
      strokeDash: 'solid',
      strokeCap: 'round',
      hasStroke: true,
      cornerRadius: 0,
      polyPoints: 5
    };

    if (type === 'line') {
      baseData.x1 = startX;
      baseData.y1 = startY;
      baseData.x2 = startX;
      baseData.y2 = startY;
      baseData.cx = startX;
      baseData.cy = startY;
      baseData.curvature = 0;
      baseData.isCurved = false;
      baseData.fillType = 'none';
      baseData.strokeWidth = 3;
      baseData.strokeColor = '#ec4899';
    } else if (type === 'connector-round') {
      baseData.x1 = startX;
      baseData.y1 = startY;
      baseData.x2 = startX;
      baseData.y2 = startY;
      baseData.roundRadius = 24;
      baseData.elbowRatio = 0.5; // Midpoint ratio between start and end
      baseData.orientation = 'horizontal-first'; // 'horizontal-first' | 'vertical-first'
      baseData.fillType = 'none';
      baseData.strokeWidth = 3;
      baseData.strokeColor = '#f59e0b';
    } else if (type === 'bezier') {
      baseData.points = [
        { x: startX, y: startY, cp1: null, cp2: null, smooth: false }
      ];
      baseData.closed = false;
      baseData.fillType = 'none';
      baseData.strokeWidth = 3;
      baseData.strokeColor = '#06b6d4';
    } else if (type === 'text') {
      baseData.text = 'Texto Vetorial';
      baseData.fontFamily = "'Inter', sans-serif";
      baseData.fontSize = 48;
      baseData.fontWeight = 'bold';
      baseData.fontStyle = 'normal';
      baseData.textAlign = 'left';
      baseData.fillType = 'solid';
      baseData.fillColor = defaultColor;
      baseData.strokeColor = '#ffffff';
      baseData.strokeWidth = 2;
      baseData.hasStroke = false;
      baseData.width = 240;
      baseData.height = 54;
    }

    return baseData;
  }

  // =========================================================================
  // GEOMETRY & PATH BUILDERS
  // =========================================================================

  // Build Right-Angle Round Connector Path
  function buildRoundConnectorPath(data) {
    const x1 = data.x1;
    const y1 = data.y1;
    const x2 = data.x2;
    const y2 = data.y2;
    const radius = Math.max(0, data.roundRadius || 0);
    const isHoriz = data.orientation !== 'vertical-first';

    // If completely aligned on X or Y, draw simple straight line
    if (Math.abs(x1 - x2) < 2 || Math.abs(y1 - y2) < 2) {
      return `M ${x1} ${y1} L ${x2} ${y2}`;
    }

    // Two 90° bends with a stepped middle segment
    if (isHoriz) {
      const mx = x1 + (x2 - x1) * (data.elbowRatio !== undefined ? data.elbowRatio : 0.5);
      
      const dx1 = Math.sign(mx - x1) || 1;
      const dy = Math.sign(y2 - y1) || 1;
      const dx2 = Math.sign(x2 - mx) || 1;

      // Available turn clearance
      const r1 = Math.min(radius, Math.abs(mx - x1) / 2, Math.abs(y2 - y1) / 2);
      const r2 = Math.min(radius, Math.abs(x2 - mx) / 2, Math.abs(y2 - y1) / 2);

      return [
        `M ${x1} ${y1}`,
        `L ${mx - dx1 * r1} ${y1}`,
        `Q ${mx} ${y1} ${mx} ${y1 + dy * r1}`,
        `L ${mx} ${y2 - dy * r2}`,
        `Q ${mx} ${y2} ${mx + dx2 * r2} ${y2}`,
        `L ${x2} ${y2}`
      ].join(' ');
    } else {
      const my = y1 + (y2 - y1) * (data.elbowRatio !== undefined ? data.elbowRatio : 0.5);

      const dy1 = Math.sign(my - y1) || 1;
      const dx = Math.sign(x2 - x1) || 1;
      const dy2 = Math.sign(y2 - my) || 1;

      const r1 = Math.min(radius, Math.abs(my - y1) / 2, Math.abs(x2 - x1) / 2);
      const r2 = Math.min(radius, Math.abs(y2 - my) / 2, Math.abs(x2 - x1) / 2);

      return [
        `M ${x1} ${y1}`,
        `L ${x1} ${my - dy1 * r1}`,
        `Q ${x1} ${my} ${x1 + dx * r1} ${my}`,
        `L ${x2 - dx * r2} ${my}`,
        `Q ${x2} ${my} ${x2} ${my + dy2 * r2}`,
        `L ${x2} ${y2}`
      ].join(' ');
    }
  }

  // Build Bézier Path String from Node Points
  function buildBezierPath(points, closed = false) {
    if (!points || points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    let d = `M ${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];

      const cp1 = prev.cp2 || { x: prev.x, y: prev.y };
      const cp2 = curr.cp1 || { x: curr.x, y: curr.y };

      if (prev.cp2 || curr.cp1) {
        d += ` C ${cp1.x.toFixed(1)} ${cp1.y.toFixed(1)} ${cp2.x.toFixed(1)} ${cp2.y.toFixed(1)} ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
      } else {
        d += ` L ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
      }
    }

    if (closed && points.length >= 2) {
      const last = points[points.length - 1];
      const first = points[0];
      const cp1 = last.cp2 || { x: last.x, y: last.y };
      const cp2 = first.cp1 || { x: first.x, y: first.y };
      if (last.cp2 || first.cp1) {
        d += ` C ${cp1.x.toFixed(1)} ${cp1.y.toFixed(1)} ${cp2.x.toFixed(1)} ${cp2.y.toFixed(1)} ${first.x.toFixed(1)} ${first.y.toFixed(1)} Z`;
      } else {
        d += ` Z`;
      }
    }

    return d;
  }

  // Recalculate line bounds and quadratic bezier curve
  function recalcLineBoundsAndCurve(item) {
    const mx = (item.x1 + item.x2) / 2;
    const my = (item.y1 + item.y2) / 2;

    if (!item.isCurved || item.curvature === 0) {
      item.cx = mx;
      item.cy = my;
    } else if (item.curvature) {
      const dx = item.x2 - item.x1;
      const dy = item.y2 - item.y1;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      item.cx = mx + nx * (item.curvature * 2);
      item.cy = my + ny * (item.curvature * 2);
    }

    const minX = Math.min(item.x1, item.x2, item.cx);
    const minY = Math.min(item.y1, item.y2, item.cy);
    const maxX = Math.max(item.x1, item.x2, item.cx);
    const maxY = Math.max(item.y1, item.y2, item.cy);

    item.x = minX;
    item.y = minY;
    item.width = Math.max(1, maxX - minX);
    item.height = Math.max(1, maxY - minY);
  }

  function recalcBezierBounds(item) {
    if (!item.points || item.points.length === 0) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    item.points.forEach(p => {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
      if (p.cp1) { minX = Math.min(minX, p.cp1.x); minY = Math.min(minY, p.cp1.y); maxX = Math.max(maxX, p.cp1.x); maxY = Math.max(maxY, p.cp1.y); }
      if (p.cp2) { minX = Math.min(minX, p.cp2.x); minY = Math.min(minY, p.cp2.y); maxX = Math.max(maxX, p.cp2.x); maxY = Math.max(maxY, p.cp2.y); }
    });
    item.x = minX;
    item.y = minY;
    item.width = Math.max(1, maxX - minX);
    item.height = Math.max(1, maxY - minY);
  }

  // =========================================================================
  // SVG RENDERING
  // =========================================================================

  function renderSvgElement(data) {
    let el = document.getElementById(data.id);
    const isNew = !el;

    // Path based shapes: line, connector-round, bezier
    if (data.type === 'line' || data.type === 'connector-round' || data.type === 'bezier') {
      let group = el;
      if (isNew) {
        group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.id = data.id;
        group.classList.add('svg-element');

        const hitPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        hitPath.classList.add('hit-stroke');
        hitPath.setAttribute('stroke-width', '28');

        const visPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        visPath.classList.add('main-stroke');

        group.appendChild(hitPath);
        group.appendChild(visPath);
        dom.shapesLayer.appendChild(group);

        group.addEventListener('pointerdown', (e) => {
          if (state.tool === 'select' && !state.spacePressed) {
            e.stopPropagation();
            selectElement(data.id);
            startMoving(e);
          }
        });
      }

      let pathD = '';
      if (data.type === 'line') {
        if (data.cx === undefined || data.cy === undefined) recalcLineBoundsAndCurve(data);
        pathD = `M ${data.x1} ${data.y1} Q ${data.cx} ${data.cy} ${data.x2} ${data.y2}`;
      } else if (data.type === 'connector-round') {
        pathD = buildRoundConnectorPath(data);
        data.x = Math.min(data.x1, data.x2);
        data.y = Math.min(data.y1, data.y2);
        data.width = Math.max(1, Math.abs(data.x2 - data.x1));
        data.height = Math.max(1, Math.abs(data.y2 - data.y1));
      } else if (data.type === 'bezier') {
        pathD = buildBezierPath(data.points, data.closed);
        recalcBezierBounds(data);
      }

      const hitPath = group.querySelector('.hit-stroke');
      const visPath = group.querySelector('.main-stroke');

      hitPath.setAttribute('d', pathD);
      visPath.setAttribute('d', pathD);

      if (data.hasStroke && data.strokeWidth > 0) {
        visPath.setAttribute('stroke', data.strokeColor);
        visPath.setAttribute('stroke-width', data.strokeWidth);
        visPath.setAttribute('stroke-linecap', data.strokeCap || 'round');
        visPath.setAttribute('stroke-linejoin', 'round');

        if (data.strokeDash === 'dashed') {
          visPath.setAttribute('stroke-dasharray', `${data.strokeWidth * 3} ${data.strokeWidth * 2}`);
        } else if (data.strokeDash === 'dotted') {
          visPath.setAttribute('stroke-dasharray', `${data.strokeWidth} ${data.strokeWidth * 2}`);
        } else {
          visPath.removeAttribute('stroke-dasharray');
        }
      } else {
        visPath.setAttribute('stroke', 'none');
      }

      // Bézier paths: render closed geometric shape with background fill and stroke
      if (data.type === 'bezier') {
        if (data.closed || data.fillType !== 'none') {
          hitPath.setAttribute('fill', 'rgba(0,0,0,0.001)');
          hitPath.style.pointerEvents = 'all';

          if (data.fillType === 'solid') {
            visPath.setAttribute('fill', data.fillColor || '#3b82f6');
            visPath.setAttribute('fill-opacity', data.fillOpacity !== undefined ? data.fillOpacity : 1);
          } else if (data.fillType === 'gradient') {
            ensureGradientDef(data);
            visPath.setAttribute('fill', `url(#${data.gradient.id})`);
            visPath.removeAttribute('fill-opacity');
          } else {
            visPath.setAttribute('fill', 'none');
          }
        } else {
          hitPath.setAttribute('fill', 'none');
          hitPath.style.pointerEvents = 'stroke';
          visPath.setAttribute('fill', 'none');
        }
      } else {
        visPath.setAttribute('fill', 'none');
      }

      return group;
    }

    // Rect, Circle, Polygon, Text
    if (isNew) {
      if (data.type === 'rect') {
        el = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      } else if (data.type === 'circle') {
        el = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
      } else if (data.type === 'polygon') {
        el = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      } else if (data.type === 'text') {
        el = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        el.classList.add('svg-text');
      }
      el.id = data.id;
      el.classList.add('svg-element');
      el.style.pointerEvents = 'all';
      dom.shapesLayer.appendChild(el);

      el.addEventListener('pointerdown', (e) => {
        if (state.tool === 'select' && !state.spacePressed) {
          e.stopPropagation();
          selectElement(data.id);
          startMoving(e);
        }
      });

      if (data.type === 'text') {
        el.addEventListener('dblclick', (e) => {
          e.stopPropagation();
          selectElement(data.id);
          if (dom.propTextContent) {
            dom.propTextContent.focus();
            dom.propTextContent.select();
          }
          if (window.innerWidth <= 900 && dom.inspectorPanel) {
            dom.inspectorPanel.classList.add('mobile-open');
          }
        });
      }
    }

    if (data.type === 'rect') {
      el.setAttribute('x', data.x);
      el.setAttribute('y', data.y);
      el.setAttribute('width', Math.max(1, data.width));
      el.setAttribute('height', Math.max(1, data.height));
      el.setAttribute('rx', data.cornerRadius || 0);
      el.setAttribute('ry', data.cornerRadius || 0);
    } else if (data.type === 'circle') {
      const rx = Math.max(1, data.width / 2);
      const ry = Math.max(1, data.height / 2);
      el.setAttribute('cx', data.x + rx);
      el.setAttribute('cy', data.y + ry);
      el.setAttribute('rx', rx);
      el.setAttribute('ry', ry);
    } else if (data.type === 'polygon') {
      const pts = computePolygonPoints(data.x, data.y, data.width, data.height, data.polyPoints || 5);
      el.setAttribute('points', pts);
    } else if (data.type === 'text') {
      el.textContent = data.text !== undefined ? data.text : 'Texto Vetorial';
      el.setAttribute('font-family', data.fontFamily || "'Inter', sans-serif");
      el.setAttribute('font-size', data.fontSize || 48);
      el.setAttribute('font-weight', data.fontWeight || 'bold');
      el.setAttribute('font-style', data.fontStyle || 'normal');
      el.setAttribute('dominant-baseline', 'hanging');
      el.style.paintOrder = 'stroke fill';

      let textX = data.x;
      if (data.textAlign === 'center') textX = data.x + data.width / 2;
      else if (data.textAlign === 'right') textX = data.x + data.width;
      el.setAttribute('x', textX);
      el.setAttribute('y', data.y);
      el.setAttribute('text-anchor', data.textAlign === 'center' ? 'middle' : (data.textAlign === 'right' ? 'end' : 'start'));

      try {
        const bbox = el.getBBox();
        if (bbox.width > 0 && bbox.height > 0) {
          data.width = Math.max(10, Math.round(bbox.width));
          data.height = Math.max(10, Math.round(bbox.height));
        }
      } catch (_) {}
    }

    const cx = data.x + data.width / 2;
    const cy = data.y + data.height / 2;
    let transformParts = [];
    if (data.rotation) {
      transformParts.push(`rotate(${data.rotation} ${cx} ${cy})`);
    }
    if (data.flipH || data.flipV) {
      const sx = data.flipH ? -1 : 1;
      const sy = data.flipV ? -1 : 1;
      transformParts.push(`translate(${cx}, ${cy}) scale(${sx}, ${sy}) translate(${-cx}, ${-cy})`);
    }

    if (transformParts.length > 0) {
      el.setAttribute('transform', transformParts.join(' '));
    } else {
      el.removeAttribute('transform');
    }

    if (data.fillType === 'none') {
      el.setAttribute('fill', 'none');
    } else if (data.fillType === 'solid') {
      el.setAttribute('fill', data.fillColor);
      el.setAttribute('fill-opacity', data.fillOpacity !== undefined ? data.fillOpacity : 1);
    } else if (data.fillType === 'gradient') {
      ensureGradientDef(data);
      el.setAttribute('fill', `url(#${data.gradient.id})`);
      el.removeAttribute('fill-opacity');
    }

    if (data.hasStroke && data.strokeWidth > 0) {
      el.setAttribute('stroke', data.strokeColor);
      el.setAttribute('stroke-width', data.strokeWidth);
      el.setAttribute('stroke-linecap', data.strokeCap || 'round');

      if (data.strokeDash === 'dashed') {
        el.setAttribute('stroke-dasharray', `${data.strokeWidth * 3} ${data.strokeWidth * 2}`);
      } else if (data.strokeDash === 'dotted') {
        el.setAttribute('stroke-dasharray', `${data.strokeWidth} ${data.strokeWidth * 2}`);
      } else {
        el.removeAttribute('stroke-dasharray');
      }
    } else {
      el.setAttribute('stroke', 'none');
      el.setAttribute('stroke-width', '0');
    }

    return el;
  }

  function computePolygonPoints(x, y, w, h, numPoints) {
    const rx = w / 2;
    const ry = h / 2;
    const cx = x + rx;
    const cy = y + ry;
    const points = [];

    for (let i = 0; i < numPoints; i++) {
      const angle = (i * 2 * Math.PI) / numPoints - Math.PI / 2;
      const px = cx + rx * Math.cos(angle);
      const py = cy + ry * Math.sin(angle);
      points.push(`${px.toFixed(1)},${py.toFixed(1)}`);
    }
    return points.join(' ');
  }

  function ensureGradientDef(data) {
    const gradId = data.gradient.id;
    let gradEl = document.getElementById(gradId);

    const isRadial = data.gradient.type === 'radial';
    const tag = isRadial ? 'radialGradient' : 'linearGradient';

    if (gradEl && gradEl.tagName.toLowerCase() !== tag.toLowerCase()) {
      gradEl.remove();
      gradEl = null;
    }

    if (!gradEl) {
      gradEl = document.createElementNS('http://www.w3.org/2000/svg', tag);
      gradEl.id = gradId;
      dom.svgDefs.appendChild(gradEl);
    }

    while (gradEl.firstChild) gradEl.removeChild(gradEl.firstChild);

    if (!isRadial) {
      const angleRad = ((data.gradient.angle || 90) - 90) * (Math.PI / 180);
      const x1 = Math.round(50 - 50 * Math.cos(angleRad));
      const y1 = Math.round(50 - 50 * Math.sin(angleRad));
      const x2 = Math.round(50 + 50 * Math.cos(angleRad));
      const y2 = Math.round(50 + 50 * Math.sin(angleRad));
      gradEl.setAttribute('x1', `${x1}%`);
      gradEl.setAttribute('y1', `${y1}%`);
      gradEl.setAttribute('x2', `${x2}%`);
      gradEl.setAttribute('y2', `${y2}%`);
    } else {
      gradEl.setAttribute('cx', '50%');
      gradEl.setAttribute('cy', '50%');
      gradEl.setAttribute('r', '50%');
    }

    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', data.gradient.stop1);

    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', data.gradient.stop2);

    gradEl.appendChild(stop1);
    gradEl.appendChild(stop2);
  }

  // =========================================================================
  // SELECTION & TRANSFORMATION SYSTEM
  // =========================================================================

  function selectElement(id) {
    if (state.selectedId === id) return;
    state.selectedId = id;
    state.selectedNodeIndex = null;
    renderSelectionOverlay();
    updateInspector();
  }

  function clearSelection() {
    if (state.selectedId !== null) {
      state.selectedId = null;
      state.selectedNodeIndex = null;
      renderSelectionOverlay();
      updateInspector();
    }
  }

  function getSelectedElement() {
    return state.selectedId ? state.elements.get(state.selectedId) : null;
  }

  function renderSelectionOverlay() {
    dom.selectionLayer.innerHTML = '';
    const item = getSelectedElement();
    if (!item) return;

    // Straight Line with Curvature
    if (item.type === 'line') {
      const lineG = document.createElementNS('http://www.w3.org/2000/svg', 'g');

      if (item.cx === undefined || item.cy === undefined) recalcLineBoundsAndCurve(item);

      const hx = 0.25 * item.x1 + 0.5 * item.cx + 0.25 * item.x2;
      const hy = 0.25 * item.y1 + 0.5 * item.cy + 0.25 * item.y2;

      if (item.isCurved) {
        const guide1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        guide1.setAttribute('x1', item.x1); guide1.setAttribute('y1', item.y1);
        guide1.setAttribute('x2', item.cx); guide1.setAttribute('y2', item.cy);
        guide1.classList.add('curve-tangent-line');
        lineG.appendChild(guide1);

        const guide2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        guide2.setAttribute('x1', item.x2); guide2.setAttribute('y1', item.y2);
        guide2.setAttribute('x2', item.cx); guide2.setAttribute('y2', item.cy);
        guide2.classList.add('curve-tangent-line');
        lineG.appendChild(guide2);
      }

      lineG.appendChild(createHandleCircle(item.x1, item.y1, 'line-p1', 'line-point-handle', 'Ponto Inicial'));
      lineG.appendChild(createHandleCircle(item.x2, item.y2, 'line-p2', 'line-point-handle', 'Ponto Final'));

      const curveH = createHandleCircle(hx, hy, 'line-curve', 'curve-handle', 'Alça de Curvatura - Arraste para curvar!');
      curveH.setAttribute('r', 7);
      lineG.appendChild(curveH);

      dom.selectionLayer.appendChild(lineG);
      return;
    }

    // Conector Redondo de Ângulo Reto
    if (item.type === 'connector-round') {
      const connG = document.createElementNS('http://www.w3.org/2000/svg', 'g');

      connG.appendChild(createHandleCircle(item.x1, item.y1, 'conn-p1', 'line-point-handle', 'Ponto Inicial'));
      connG.appendChild(createHandleCircle(item.x2, item.y2, 'conn-p2', 'line-point-handle', 'Ponto Final'));

      // Elbow handle position
      const isHoriz = item.orientation !== 'vertical-first';
      let ex, ey;
      if (isHoriz) {
        ex = item.x1 + (item.x2 - item.x1) * (item.elbowRatio || 0.5);
        ey = (item.y1 + item.y2) / 2;
      } else {
        ex = (item.x1 + item.x2) / 2;
        ey = item.y1 + (item.y2 - item.y1) * (item.elbowRatio || 0.5);
      }

      const elbowH = createHandleCircle(ex, ey, 'conn-elbow', 'elbow-handle' + (isHoriz ? '' : ' vertical-move'), 'Alça de Dobra (Cotovelo) - Arraste para reposicionar');
      elbowH.setAttribute('r', 7);
      connG.appendChild(elbowH);

      dom.selectionLayer.appendChild(connG);
      return;
    }

    // Bézier Path
    if (item.type === 'bezier') {
      const bezG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      const numPts = item.points ? item.points.length : 0;

      // 1. Direct Segment Curving Handles (CorelDRAW F10 Style)
      // Allows user to click and drag ANY line segment to curve / bend it directly!
      if (numPts > 1) {
        const segCount = item.closed ? numPts : numPts - 1;
        for (let i = 0; i < segCount; i++) {
          const nextIdx = (i + 1) % numPts;
          const pA = item.points[i];
          const pB = item.points[nextIdx];
          const cpA = pA.cp2 || { x: pA.x, y: pA.y };
          const cpB = pB.cp1 || { x: pB.x, y: pB.y };

          const segPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          let segD = '';
          if (pA.cp2 || pB.cp1) {
            segD = `M ${pA.x} ${pA.y} C ${cpA.x.toFixed(1)} ${cpA.y.toFixed(1)} ${cpB.x.toFixed(1)} ${cpB.y.toFixed(1)} ${pB.x} ${pB.y}`;
          } else {
            segD = `M ${pA.x} ${pA.y} L ${pB.x} ${pB.y}`;
          }
          segPath.setAttribute('d', segD);
          segPath.classList.add('bezier-segment-curve-handle');
          segPath.setAttribute('title', `Linha do Segmento #${i + 1} - Arraste diretamente para entornar / curvar a linha!`);
          segPath.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            state.selectedNodeIndex = i;
            renderSelectionOverlay();
            updateInspector();
            startBezierSegmentCurving(e, i, nextIdx);
          });
          bezG.appendChild(segPath);
        }
      }

      // 2. Nodes, Tangents, and Curvature Controls
      item.points.forEach((pt, idx) => {
        const isActive = state.selectedNodeIndex === idx;

        // Tangent handles for active node OR any node with tangents
        if (isActive || pt.cp1 || pt.cp2) {
          if (pt.cp1) {
            const l1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            l1.setAttribute('x1', pt.x); l1.setAttribute('y1', pt.y);
            l1.setAttribute('x2', pt.cp1.x); l1.setAttribute('y2', pt.cp1.y);
            l1.classList.add('bezier-tangent-line');
            bezG.appendChild(l1);

            const cp1H = createHandleCircle(pt.cp1.x, pt.cp1.y, `bez-cp1-${idx}`, 'bezier-tangent-handle', `Alça de Curvatura 1 (Nó #${idx + 1}) - Arraste para entornar`);
            bezG.appendChild(cp1H);
          }

          if (pt.cp2) {
            const l2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            l2.setAttribute('x1', pt.x); l2.setAttribute('y1', pt.y);
            l2.setAttribute('x2', pt.cp2.x); l2.setAttribute('y2', pt.cp2.y);
            l2.classList.add('bezier-tangent-line');
            bezG.appendChild(l2);

            const cp2H = createHandleCircle(pt.cp2.x, pt.cp2.y, `bez-cp2-${idx}`, 'bezier-tangent-handle', `Alça de Curvatura 2 (Nó #${idx + 1}) - Arraste para entornar`);
            bezG.appendChild(cp2H);
          }
        }

        // Quick Curvature Button when active node has straight lines
        if (isActive && !pt.cp1 && !pt.cp2) {
          const curveBtn = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          curveBtn.setAttribute('cx', pt.x);
          curveBtn.setAttribute('cy', pt.y - 14);
          curveBtn.setAttribute('r', 5);
          curveBtn.classList.add('bezier-pull-curve-btn');
          curveBtn.setAttribute('title', 'Clique para curvar e entornar as linhas deste ponto!');
          curveBtn.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            curveSelectedNode();
          });
          bezG.appendChild(curveBtn);
        }

        // Square Anchor Node
        const anchor = createHandleSquare(pt.x, pt.y, `bez-node-${idx}`, 'bezier-anchor-handle' + (isActive ? ' active' : ''));
        anchor.setAttribute('title', `Nó Bézier #${idx + 1} - Clique para selecionar, arraste para mover, ou duplo clique para curvar/descurvar`);
        anchor.addEventListener('dblclick', (e) => {
          e.stopPropagation();
          state.selectedNodeIndex = idx;
          if (pt.cp1 || pt.cp2) {
            straightenSelectedNode();
          } else {
            curveSelectedNode();
          }
        });
        bezG.appendChild(anchor);
      });

      dom.selectionLayer.appendChild(bezG);
      return;
    }

    // Bounding Box for Rect, Circle, Polygon
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const cx = item.x + item.width / 2;
    const cy = item.y + item.height / 2;

    let transformParts = [];
    if (item.rotation) {
      transformParts.push(`rotate(${item.rotation} ${cx} ${cy})`);
    }
    if (item.flipH || item.flipV) {
      const sx = item.flipH ? -1 : 1;
      const sy = item.flipV ? -1 : 1;
      transformParts.push(`translate(${cx}, ${cy}) scale(${sx}, ${sy}) translate(${-cx}, ${-cy})`);
    }
    if (transformParts.length > 0) {
      g.setAttribute('transform', transformParts.join(' '));
    }

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', item.x);
    rect.setAttribute('y', item.y);
    rect.setAttribute('width', Math.max(1, item.width));
    rect.setAttribute('height', Math.max(1, item.height));
    rect.classList.add('selection-box');
    g.appendChild(rect);

    const x = item.x;
    const y = item.y;
    const w = item.width;
    const h = item.height;

    const handles = [
      { id: 'nw', x: x, y: y, cursor: 'handle-nw' },
      { id: 'n',  x: x + w / 2, y: y, cursor: 'handle-n' },
      { id: 'ne', x: x + w, y: y, cursor: 'handle-ne' },
      { id: 'e',  x: x + w, y: y + h / 2, cursor: 'handle-e' },
      { id: 'se', x: x + w, y: y + h, cursor: 'handle-se' },
      { id: 's',  x: x + w / 2, y: y + h, cursor: 'handle-s' },
      { id: 'sw', x: x, y: y + h, cursor: 'handle-sw' },
      { id: 'w',  x: x, y: y + h / 2, cursor: 'handle-w' }
    ];

    handles.forEach(hnd => {
      g.appendChild(createHandleSquare(hnd.x, hnd.y, hnd.id, hnd.cursor));
    });

    const rotLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    rotLine.setAttribute('x1', cx); rotLine.setAttribute('y1', y);
    rotLine.setAttribute('x2', cx); rotLine.setAttribute('y2', y - 24);
    rotLine.classList.add('rotation-line');
    g.appendChild(rotLine);

    g.appendChild(createHandleCircle(cx, y - 24, 'rotate', 'rotation-handle', 'Girar Forma'));
    dom.selectionLayer.appendChild(g);
  }

  function createHandleSquare(x, y, handleId, cursorClass) {
    const size = 9;
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', x - size / 2);
    rect.setAttribute('y', y - size / 2);
    rect.setAttribute('width', size);
    rect.setAttribute('height', size);
    rect.setAttribute('data-handle', handleId);
    rect.classList.add('selection-handle');
    if (cursorClass) {
      cursorClass.trim().split(/\s+/).forEach(c => { if (c) rect.classList.add(c); });
    }
    rect.style.pointerEvents = 'auto';

    rect.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      if (handleId.startsWith('bez-node-')) {
        const idx = parseInt(handleId.replace('bez-node-', ''), 10);
        state.selectedNodeIndex = idx;
        renderSelectionOverlay();
        updateInspector();
        startBezierNodeMove(e, idx);
      } else {
        startResizing(e, handleId);
      }
    });

    return rect;
  }

  function createHandleCircle(cx, cy, handleId, extraClass, title = '') {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', cx);
    circle.setAttribute('cy', cy);
    circle.setAttribute('r', 6);
    circle.setAttribute('data-handle', handleId);
    circle.classList.add('selection-handle');
    if (extraClass) {
      extraClass.trim().split(/\s+/).forEach(c => { if (c) circle.classList.add(c); });
    }
    circle.style.pointerEvents = 'auto';
    if (title) circle.setAttribute('title', title);

    circle.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      if (handleId === 'rotate') {
        startRotating(e);
      } else if (handleId === 'line-p1' || handleId === 'line-p2' || handleId === 'line-curve') {
        startLineEndpointMove(e, handleId);
      } else if (handleId === 'conn-p1' || handleId === 'conn-p2' || handleId === 'conn-elbow') {
        startConnectorMove(e, handleId);
      } else if (handleId.startsWith('bez-cp1-') || handleId.startsWith('bez-cp2-')) {
        const parts = handleId.split('-');
        const cpType = parts[1]; // 'cp1' or 'cp2'
        const idx = parseInt(parts[2], 10);
        startBezierTangentMove(e, idx, cpType);
      }
    });

    return circle;
  }

  // =========================================================================
  // TRANSFORM CONTROLLERS
  // =========================================================================

  function startMoving(e) {
    const item = getSelectedElement();
    if (!item) return;

    const startPos = clientToSvgCoords(e.clientX, e.clientY);
    state.transforming = {
      type: 'move',
      startX: startPos.x,
      startY: startPos.y,
      origX: item.x,
      origY: item.y,
      origX1: item.x1,
      origY1: item.y1,
      origX2: item.x2,
      origY2: item.y2,
      origCx: item.cx,
      origCy: item.cy,
      origPoints: item.points ? JSON.parse(JSON.stringify(item.points)) : null
    };
  }

  function startResizing(e, handleId) {
    const item = getSelectedElement();
    if (!item) return;

    const startPos = clientToSvgCoords(e.clientX, e.clientY);
    state.transforming = {
      type: 'resize',
      handle: handleId,
      startX: startPos.x,
      startY: startPos.y,
      origX: item.x,
      origY: item.y,
      origW: item.width,
      origH: item.height,
      origFontSize: item.fontSize || 48,
      shiftKey: e.shiftKey
    };
  }

  function startRotating(e) {
    const item = getSelectedElement();
    if (!item) return;

    const cx = item.x + item.width / 2;
    const cy = item.y + item.height / 2;
    state.transforming = {
      type: 'rotate',
      cx, cy,
      origRotation: item.rotation || 0
    };
  }

  function startLineEndpointMove(e, pointId) {
    const item = getSelectedElement();
    if (!item || item.type !== 'line') return;

    const startPos = clientToSvgCoords(e.clientX, e.clientY);
    state.transforming = {
      type: pointId,
      startX: startPos.x,
      startY: startPos.y,
      origX1: item.x1,
      origY1: item.y1,
      origX2: item.x2,
      origY2: item.y2,
      origCx: item.cx,
      origCy: item.cy
    };
  }

  function startConnectorMove(e, handleId) {
    const item = getSelectedElement();
    if (!item || item.type !== 'connector-round') return;

    const startPos = clientToSvgCoords(e.clientX, e.clientY);
    state.transforming = {
      type: handleId, // 'conn-p1' | 'conn-p2' | 'conn-elbow'
      startX: startPos.x,
      startY: startPos.y,
      origX1: item.x1,
      origY1: item.y1,
      origX2: item.x2,
      origY2: item.y2,
      origRatio: item.elbowRatio || 0.5
    };
  }

  function startBezierNodeMove(e, nodeIndex) {
    const item = getSelectedElement();
    if (!item || item.type !== 'bezier') return;

    const startPos = clientToSvgCoords(e.clientX, e.clientY);
    const pt = item.points[nodeIndex];
    state.transforming = {
      type: 'bez-node',
      nodeIndex,
      startX: startPos.x,
      startY: startPos.y,
      origPtX: pt.x,
      origPtY: pt.y,
      origCp1X: pt.cp1 ? pt.cp1.x : null,
      origCp1Y: pt.cp1 ? pt.cp1.y : null,
      origCp2X: pt.cp2 ? pt.cp2.x : null,
      origCp2Y: pt.cp2 ? pt.cp2.y : null
    };
  }

  function startBezierTangentMove(e, nodeIndex, cpType) {
    const item = getSelectedElement();
    if (!item || item.type !== 'bezier') return;

    state.transforming = {
      type: 'bez-tangent',
      nodeIndex,
      cpType // 'cp1' or 'cp2'
    };
  }

  function startBezierSegmentCurving(e, idxA, idxB) {
    const item = getSelectedElement();
    if (!item || item.type !== 'bezier') return;

    const startPos = clientToSvgCoords(e.clientX, e.clientY);
    const pA = item.points[idxA];
    const pB = item.points[idxB];

    // If cp2 on pA is null, initialize along the line
    if (!pA.cp2) {
      pA.cp2 = { x: pA.x + (pB.x - pA.x) * 0.33, y: pA.y + (pB.y - pA.y) * 0.33 };
    }
    // If cp1 on pB is null, initialize along the line
    if (!pB.cp1) {
      pB.cp1 = { x: pA.x + (pB.x - pA.x) * 0.67, y: pA.y + (pB.y - pA.y) * 0.67 };
    }

    state.transforming = {
      type: 'bez-segment-curve',
      idxA,
      idxB,
      startX: startPos.x,
      startY: startPos.y,
      origCpA: { x: pA.cp2.x, y: pA.cp2.y },
      origCpB: { x: pB.cp1.x, y: pB.cp1.y }
    };
  }

  // =========================================================================
  // BÉZIER DRAWING TOOL SYSTEM
  // =========================================================================

  function handleBezierToolPointerDown(e, pt) {
    if (!state.bezierDraft) {
      state.bezierDraft = {
        points: [{ x: pt.x, y: pt.y, cp1: null, cp2: null, smooth: false }],
        closed: false,
        draggingTangent: true,
        currentIndex: 0
      };
      renderBezierPreview();
      showToast('Bézier: clique para adicionar nós. Para fechar a forma, clique no nó inicial ou dê Enter.');
      return;
    }

    const points = state.bezierDraft.points;
    const first = points[0];
    const distToFirst = Math.hypot(pt.x - first.x, pt.y - first.y);

    // Magnetic snap to first point to close and create geometric shape
    if (points.length >= 3 && distToFirst < 30) {
      state.bezierDraft.closed = true;
      finishBezierDraft();
      return;
    }

    // Add new point to draft
    const newPt = { x: pt.x, y: pt.y, cp1: null, cp2: null, smooth: false };
    points.push(newPt);
    state.bezierDraft.currentIndex = points.length - 1;
    state.bezierDraft.draggingTangent = true;
    renderBezierPreview();
  }

  function handleBezierDraftDrag(pt) {
    if (!state.bezierDraft || !state.bezierDraft.draggingTangent) return;

    const draft = state.bezierDraft;
    const curr = draft.points[draft.currentIndex];
    if (!curr) return;

    const dx = pt.x - curr.x;
    const dy = pt.y - curr.y;

    if (Math.hypot(dx, dy) > 3) {
      curr.cp2 = { x: curr.x + dx, y: curr.y + dy };
      curr.cp1 = { x: curr.x - dx, y: curr.y - dy };
      curr.smooth = true;
    }

    renderBezierPreview();
  }

  function renderBezierPreview(cursorPt = null) {
    dom.previewLayer.innerHTML = '';
    if (!state.bezierDraft) return;

    const points = [...state.bezierDraft.points];
    const first = points[0];
    let isNearFirst = false;

    if (cursorPt && !state.bezierDraft.draggingTangent) {
      const distToFirst = Math.hypot(cursorPt.x - first.x, cursorPt.y - first.y);
      if (points.length >= 3 && distToFirst < 30) {
        isNearFirst = true;
        // Snap directly to first point
        points.push({ x: first.x, y: first.y, cp1: null, cp2: null });
      } else {
        points.push({ x: cursorPt.x, y: cursorPt.y, cp1: null, cp2: null });
      }
    }

    const d = buildBezierPath(points, isNearFirst || state.bezierDraft.closed);
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('stroke', isNearFirst ? '#10b981' : '#06b6d4');
    path.setAttribute('stroke-width', '2.5');
    path.setAttribute('stroke-dasharray', '4 3');
    path.setAttribute('fill', isNearFirst ? 'rgba(16, 185, 129, 0.15)' : 'none');
    dom.previewLayer.appendChild(path);

    // Render draft nodes
    state.bezierDraft.points.forEach((p, i) => {
      const nodeSquare = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      nodeSquare.setAttribute('x', p.x - 4);
      nodeSquare.setAttribute('y', p.y - 4);
      nodeSquare.setAttribute('width', 8);
      nodeSquare.setAttribute('height', 8);
      nodeSquare.setAttribute('fill', i === 0 ? (isNearFirst ? '#10b981' : '#34d399') : '#ffffff');
      nodeSquare.setAttribute('stroke', '#06b6d4');
      nodeSquare.setAttribute('stroke-width', '1.5');
      dom.previewLayer.appendChild(nodeSquare);
    });

    // Magnetic snap ring and text badge
    if (isNearFirst) {
      const snapRing = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      snapRing.setAttribute('cx', first.x);
      snapRing.setAttribute('cy', first.y);
      snapRing.setAttribute('r', 16);
      snapRing.classList.add('bezier-snap-ring');
      dom.previewLayer.appendChild(snapRing);

      const snapText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      snapText.setAttribute('x', first.x);
      snapText.setAttribute('y', first.y - 20);
      snapText.classList.add('bezier-snap-label');
      snapText.textContent = 'Clique para Ligar Pontos (Forma Geométrica)';
      dom.previewLayer.appendChild(snapText);
    }
  }

  function finishBezierDraft() {
    if (!state.bezierDraft || state.bezierDraft.points.length < 2) {
      cancelBezierDraft();
      return;
    }

    const newShape = createNewShape('bezier', 0, 0);
    newShape.points = state.bezierDraft.points;

    // Check if points close upon themselves
    const first = newShape.points[0];
    const last = newShape.points[newShape.points.length - 1];
    const distToFirst = Math.hypot(last.x - first.x, last.y - first.y);

    if (state.bezierDraft.closed || (newShape.points.length >= 3 && distToFirst < 60)) {
      newShape.closed = true;
      if (distToFirst < 40 && newShape.points.length > 3) {
        newShape.points.pop();
      }
      // Auto-initialize background fill color on closed geometric shape!
      newShape.fillType = 'solid';
      newShape.fillColor = dom.propFillColor ? dom.propFillColor.value : '#3b82f6';
      newShape.fillOpacity = 1;
    } else {
      newShape.closed = false;
      newShape.fillType = 'none';
    }

    newShape.strokeColor = dom.propStrokeColor ? dom.propStrokeColor.value : '#ec4899';
    newShape.strokeWidth = dom.propStrokeWidth ? parseInt(dom.propStrokeWidth.value, 10) || 3 : 3;

    recalcBezierBounds(newShape);
    state.elements.set(newShape.id, newShape);
    renderSvgElement(newShape);

    cancelBezierDraft();
    selectElement(newShape.id);
    saveHistoryState();
    setTool('select');

    if (newShape.closed) {
      showToast('Forma geométrica criada! Você pode alterar a cor de fundo e o contorno no painel.');
    } else {
      showToast('Curva criada. Para preencher cor de fundo, clique em "Ligar Pontos".');
    }
  }

  function cancelBezierDraft() {
    state.bezierDraft = null;
    dom.previewLayer.innerHTML = '';
  }

  // =========================================================================
  // SPECIAL ACTIONS
  // =========================================================================

  function convertSelectedShape() {
    const item = getSelectedElement();
    if (!item) return;

    if (item.type === 'rect') {
      const oldEl = document.getElementById(item.id);
      if (oldEl) oldEl.remove();

      item.type = 'circle';
      item.cornerRadius = 0;
      renderSvgElement(item);
      renderSelectionOverlay();
      updateInspector();
      saveHistoryState();
      showToast('Quadro convertido em Círculo com sucesso!');
    } else if (item.type === 'circle') {
      const oldEl = document.getElementById(item.id);
      if (oldEl) oldEl.remove();

      item.type = 'rect';
      item.cornerRadius = 0;
      renderSvgElement(item);
      renderSelectionOverlay();
      updateInspector();
      saveHistoryState();
      showToast('Círculo convertido em Quadro com sucesso!');
    }
  }

  function toggleLineCurvature() {
    const item = getSelectedElement();
    if (!item || item.type !== 'line') return;

    if (item.isCurved) {
      item.isCurved = false;
      item.curvature = 0;
      recalcLineBoundsAndCurve(item);
      showToast('Linha convertida em Reta');
    } else {
      item.isCurved = true;
      item.curvature = 40;
      recalcLineBoundsAndCurve(item);
      showToast('Linha curvada! Arraste a alça ciano para ajustar');
    }

    renderSvgElement(item);
    renderSelectionOverlay();
    updateInspector();
    saveHistoryState();
  }

  function setLineCurvatureAmount(val) {
    const item = getSelectedElement();
    if (!item || item.type !== 'line') return;

    item.curvature = val;
    item.isCurved = Math.abs(val) > 2;
    recalcLineBoundsAndCurve(item);

    renderSvgElement(item);
    renderSelectionOverlay();
    updateInspector();
  }

  function setConnectorRadius(val) {
    const item = getSelectedElement();
    if (!item || item.type !== 'connector-round') return;

    item.roundRadius = Math.max(0, val);
    renderSvgElement(item);
    renderSelectionOverlay();
    updateInspector();
  }

  function toggleElbowDirection() {
    const item = getSelectedElement();
    if (!item || item.type !== 'connector-round') return;

    item.orientation = item.orientation === 'vertical-first' ? 'horizontal-first' : 'vertical-first';
    renderSvgElement(item);
    renderSelectionOverlay();
    updateInspector();
    saveHistoryState();
  }

  function toggleBezierClosed() {
    const item = getSelectedElement();
    if (!item || item.type !== 'bezier') return;

    item.closed = !item.closed;
    if (item.closed) {
      if (!item.fillType || item.fillType === 'none') {
        item.fillType = 'solid';
        item.fillColor = dom.propFillColor ? dom.propFillColor.value : '#3b82f6';
        item.fillOpacity = 1;
      }
    }
    renderSvgElement(item);
    renderSelectionOverlay();
    updateInspector();
    saveHistoryState();
    showToast(item.closed ? '✨ Pontos ligados! Forma geométrica fechada criada com cor de fundo.' : 'Caminho Bézier aberto');
  }

  function curveSelectedNode() {
    const item = getSelectedElement();
    if (!item || item.type !== 'bezier' || !item.points || item.points.length === 0) return;

    const idx = (state.selectedNodeIndex !== null && state.selectedNodeIndex < item.points.length) 
      ? state.selectedNodeIndex 
      : 0;
    state.selectedNodeIndex = idx;
    const pt = item.points[idx];
    const N = item.points.length;
    const prev = item.points[(idx - 1 + N) % N];
    const next = item.points[(idx + 1) % N];

    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    const dist1 = Math.max(30, Math.min(80, Math.hypot(pt.x - prev.x, pt.y - prev.y) * 0.35));
    const dist2 = Math.max(30, Math.min(80, Math.hypot(next.x - pt.x, next.y - pt.y) * 0.35));

    if (!item.closed && idx === 0) {
      const dNextX = next.x - pt.x;
      const dNextY = next.y - pt.y;
      const dLen = Math.hypot(dNextX, dNextY) || 1;
      pt.cp2 = { x: pt.x + (dNextX / dLen) * dist2, y: pt.y + (dNextY / dLen) * dist2 };
      pt.cp1 = null;
    } else if (!item.closed && idx === N - 1) {
      const dPrevX = prev.x - pt.x;
      const dPrevY = prev.y - pt.y;
      const dLen = Math.hypot(dPrevX, dPrevY) || 1;
      pt.cp1 = { x: pt.x + (dPrevX / dLen) * dist1, y: pt.y + (dPrevY / dLen) * dist1 };
      pt.cp2 = null;
    } else {
      pt.cp1 = { x: pt.x - (dx / len) * dist1, y: pt.y - (dy / len) * dist1 };
      pt.cp2 = { x: pt.x + (dx / len) * dist2, y: pt.y + (dy / len) * dist2 };
    }

    pt.smooth = true;
    recalcBezierBounds(item);
    renderSvgElement(item);
    renderSelectionOverlay();
    updateInspector();
    saveHistoryState();
    showToast(`Linha do Nó #${idx + 1} curvada! Arraste as alças ciano para entornar a linha.`);
  }

  function straightenSelectedNode() {
    const item = getSelectedElement();
    if (!item || item.type !== 'bezier' || !item.points || item.points.length === 0) return;

    const idx = (state.selectedNodeIndex !== null && state.selectedNodeIndex < item.points.length) 
      ? state.selectedNodeIndex 
      : 0;
    const pt = item.points[idx];
    pt.cp1 = null;
    pt.cp2 = null;
    pt.smooth = false;

    recalcBezierBounds(item);
    renderSvgElement(item);
    renderSelectionOverlay();
    updateInspector();
    saveHistoryState();
    showToast(`Nó #${idx + 1} convertido em linha reta.`);
  }

  function toggleSmoothSelectedNode() {
    const item = getSelectedElement();
    if (!item || item.type !== 'bezier' || !item.points || item.points.length === 0) return;

    const idx = (state.selectedNodeIndex !== null && state.selectedNodeIndex < item.points.length) 
      ? state.selectedNodeIndex 
      : 0;
    const pt = item.points[idx];

    if (!pt.cp1 && !pt.cp2) {
      curveSelectedNode();
      return;
    }

    pt.smooth = !pt.smooth;
    if (pt.smooth && pt.cp1 && pt.cp2) {
      const dx = pt.cp1.x - pt.x;
      const dy = pt.cp1.y - pt.y;
      const len1 = Math.hypot(dx, dy) || 1;
      const len2 = Math.hypot(pt.cp2.x - pt.x, pt.cp2.y - pt.y) || 1;
      pt.cp2 = { x: pt.x - (dx / len1) * len2, y: pt.y - (dy / len1) * len2 };
    }

    recalcBezierBounds(item);
    renderSvgElement(item);
    renderSelectionOverlay();
    updateInspector();
    saveHistoryState();
    showToast(pt.smooth ? `Nó #${idx + 1} agora é Suave (alças alinhadas)` : `Nó #${idx + 1} agora é Cúspide (alças independentes)`);
  }

  function deleteSelectedNode() {
    const item = getSelectedElement();
    if (!item || item.type !== 'bezier' || !item.points || item.points.length <= 2) {
      showToast('A forma precisa ter no mínimo 2 pontos.');
      return;
    }

    const idx = (state.selectedNodeIndex !== null && state.selectedNodeIndex < item.points.length) 
      ? state.selectedNodeIndex 
      : item.points.length - 1;

    item.points.splice(idx, 1);
    state.selectedNodeIndex = Math.min(idx, item.points.length - 1);

    recalcBezierBounds(item);
    renderSvgElement(item);
    renderSelectionOverlay();
    updateInspector();
    saveHistoryState();
    showToast(`Nó #${idx + 1} excluído.`);
  }

  function setCornerRadius(val) {
    const item = getSelectedElement();
    if (!item || item.type !== 'rect') return;

    const maxRadius = Math.min(item.width, item.height) / 2;
    item.cornerRadius = Math.min(maxRadius, Math.max(0, val));
    renderSvgElement(item);
    renderSelectionOverlay();
    updateInspector();
  }

  function setPolygonPoints(num) {
    const item = getSelectedElement();
    if (!item || item.type !== 'polygon') return;

    item.polyPoints = Math.max(3, Math.min(24, num));
    renderSvgElement(item);
    renderSelectionOverlay();
    updateInspector();
  }

  // =========================================================================
  // POINTER EVENT HANDLERS
  // =========================================================================

  function handlePointerDown(e) {
    if (e.button === 1 || state.spacePressed || state.tool === 'pan') {
      state.isPanning = true;
      state.panStart = { x: e.clientX - state.pan.x, y: e.clientY - state.pan.y };
      dom.viewport.classList.add('panning');
      return;
    }

    if (e.button !== 0) return;

    const pt = clientToSvgCoords(e.clientX, e.clientY);

    // Bézier Tool
    if (state.tool === 'bezier') {
      handleBezierToolPointerDown(e, pt);
      return;
    }

    // Select Tool
    if (state.tool === 'select') {
      if (e.target === dom.svg || e.target.id === 'canvas-bg' || e.target.id === 'canvas-grid') {
        clearSelection();
      }
      return;
    }

    // Text Tool: place text at click position
    if (state.tool === 'text') {
      const newText = createNewShape('text', pt.x, pt.y);
      applyCurrentDefaultStyles(newText);
      state.elements.set(newText.id, newText);
      renderSvgElement(newText);
      selectElement(newText.id);
      saveHistoryState();
      setTool('select');
      if (dom.propTextContent) {
        dom.propTextContent.focus();
        dom.propTextContent.select();
      }
      if (window.innerWidth <= 900 && dom.inspectorPanel) {
        dom.inspectorPanel.classList.add('mobile-open');
      }
      showToast('Texto inserido! Edite o conteúdo ou fonte no painel.');
      return;
    }

    // New shape creation (line, connector-round, rect, circle, polygon)
    state.isDrawing = true;
    state.drawStart = pt;

    const newShape = createNewShape(state.tool, pt.x, pt.y);
    state.currentDrawingShape = newShape;

    applyCurrentDefaultStyles(newShape);
  }

  function handlePointerMove(e) {
    if (state.isPanning) {
      state.pan.x = e.clientX - state.panStart.x;
      state.pan.y = e.clientY - state.panStart.y;
      applyTransform();
      return;
    }

    const pt = clientToSvgCoords(e.clientX, e.clientY);

    if (state.tool === 'bezier') {
      if (state.bezierDraft && state.bezierDraft.draggingTangent) {
        handleBezierDraftDrag(pt);
      } else if (state.bezierDraft) {
        renderBezierPreview(pt);
      }
      return;
    }

    if (state.transforming) {
      handleTransformMove(e);
      return;
    }

    if (state.isDrawing && state.currentDrawingShape) {
      handleDrawMove(e);
    }
  }

  function handleDrawMove(e) {
    const pt = clientToSvgCoords(e.clientX, e.clientY);
    const shape = state.currentDrawingShape;

    if (shape.type === 'line' || shape.type === 'connector-round') {
      let x2 = pt.x;
      let y2 = pt.y;

      if (e.shiftKey && shape.type === 'line') {
        const dx = x2 - shape.x1;
        const dy = y2 - shape.y1;
        const angle = Math.atan2(dy, dx);
        const snappedAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
        const dist = Math.hypot(dx, dy);
        x2 = shape.x1 + dist * Math.cos(snappedAngle);
        y2 = shape.y1 + dist * Math.sin(snappedAngle);
      }

      shape.x2 = x2;
      shape.y2 = y2;
      shape.width = Math.abs(x2 - shape.x1);
      shape.height = Math.abs(y2 - shape.y1);
      shape.x = Math.min(shape.x1, x2);
      shape.y = Math.min(shape.y1, y2);
      if (shape.type === 'line') {
        shape.cx = (shape.x1 + x2) / 2;
        shape.cy = (shape.y1 + y2) / 2;
      }
    } else {
      let width = pt.x - state.drawStart.x;
      let height = pt.y - state.drawStart.y;

      if (e.shiftKey) {
        const size = Math.max(Math.abs(width), Math.abs(height));
        width = width < 0 ? -size : size;
        height = height < 0 ? -size : size;
      }

      shape.x = width < 0 ? state.drawStart.x + width : state.drawStart.x;
      shape.y = height < 0 ? state.drawStart.y + height : state.drawStart.y;
      shape.width = Math.abs(width);
      shape.height = Math.abs(height);
    }

    renderSvgElement(shape);
  }

  function handleTransformMove(e) {
    const pt = clientToSvgCoords(e.clientX, e.clientY);
    const item = getSelectedElement();
    if (!item) return;

    const t = state.transforming;

    if (t.type === 'move') {
      const dx = pt.x - t.startX;
      const dy = pt.y - t.startY;

      if (item.type === 'line' || item.type === 'connector-round') {
        item.x1 = t.origX1 + dx;
        item.y1 = t.origY1 + dy;
        item.x2 = t.origX2 + dx;
        item.y2 = t.origY2 + dy;
        if (item.cx !== undefined) item.cx = t.origCx + dx;
        if (item.cy !== undefined) item.cy = t.origCy + dy;
        item.x = Math.min(item.x1, item.x2);
        item.y = Math.min(item.y1, item.y2);
        item.width = Math.max(1, Math.abs(item.x2 - item.x1));
        item.height = Math.max(1, Math.abs(item.y2 - item.y1));
      } else if (item.type === 'bezier') {
        item.points.forEach((p, idx) => {
          const orig = t.origPoints[idx];
          p.x = orig.x + dx;
          p.y = orig.y + dy;
          if (p.cp1) { p.cp1.x = orig.cp1.x + dx; p.cp1.y = orig.cp1.y + dy; }
          if (p.cp2) { p.cp2.x = orig.cp2.x + dx; p.cp2.y = orig.cp2.y + dy; }
        });
        recalcBezierBounds(item);
      } else {
        item.x = t.origX + dx;
        item.y = t.origY + dy;
      }
    } else if (t.type === 'resize') {
      let dx = pt.x - t.startX;
      let dy = pt.y - t.startY;
      const handle = t.handle;

      let newX = t.origX;
      let newY = t.origY;
      let newW = t.origW;
      let newH = t.origH;

      if (handle.includes('e')) newW = Math.max(5, t.origW + dx);
      if (handle.includes('s')) newH = Math.max(5, t.origH + dy);
      if (handle.includes('w')) {
        newW = Math.max(5, t.origW - dx);
        newX = t.origX + (t.origW - newW);
      }
      if (handle.includes('n')) {
        newH = Math.max(5, t.origH - dy);
        newY = t.origY + (t.origH - newH);
      }

      if (e.shiftKey) {
        const ratio = t.origW / t.origH;
        if (newW / ratio < newH) newH = newW / ratio;
        else newW = newH * ratio;
      }

      if (item.type === 'text' && t.origFontSize) {
        const scale = Math.max(0.1, newH / (t.origH || 1));
        item.fontSize = Math.max(8, Math.min(500, Math.round(t.origFontSize * scale)));
      }

      item.x = newX;
      item.y = newY;
      item.width = newW;
      item.height = newH;
    } else if (t.type === 'rotate') {
      const dx = pt.x - t.cx;
      const dy = pt.y - t.cy;
      let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
      if (angle < 0) angle += 360;
      if (e.shiftKey) angle = Math.round(angle / 15) * 15;
      item.rotation = Math.round(angle);
    } else if (t.type === 'line-p1') {
      item.x1 = pt.x; item.y1 = pt.y;
      recalcLineBoundsAndCurve(item);
    } else if (t.type === 'line-p2') {
      item.x2 = pt.x; item.y2 = pt.y;
      recalcLineBoundsAndCurve(item);
    } else if (t.type === 'line-curve') {
      const mx = (item.x1 + item.x2) / 2;
      const my = (item.y1 + item.y2) / 2;
      item.cx = 2 * pt.x - mx;
      item.cy = 2 * pt.y - my;

      const dx = item.x2 - item.x1;
      const dy = item.y2 - item.y1;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      item.curvature = Math.round((pt.x - mx) * nx + (pt.y - my) * ny);
      item.isCurved = Math.abs(item.curvature) > 2;
      recalcLineBoundsAndCurve(item);
    } else if (t.type === 'conn-p1') {
      item.x1 = pt.x; item.y1 = pt.y;
    } else if (t.type === 'conn-p2') {
      item.x2 = pt.x; item.y2 = pt.y;
    } else if (t.type === 'conn-elbow') {
      const isHoriz = item.orientation !== 'vertical-first';
      if (isHoriz) {
        const totalX = item.x2 - item.x1;
        if (Math.abs(totalX) > 4) {
          const ratio = (pt.x - item.x1) / totalX;
          item.elbowRatio = Math.max(0.1, Math.min(0.9, ratio));
        }
      } else {
        const totalY = item.y2 - item.y1;
        if (Math.abs(totalY) > 4) {
          const ratio = (pt.y - item.y1) / totalY;
          item.elbowRatio = Math.max(0.1, Math.min(0.9, ratio));
        }
      }
    } else if (t.type === 'bez-node') {
      const p = item.points[t.nodeIndex];
      const dx = pt.x - t.startX;
      const dy = pt.y - t.startY;
      p.x = t.origPtX + dx;
      p.y = t.origPtY + dy;
      if (p.cp1) { p.cp1.x = t.origCp1X + dx; p.cp1.y = t.origCp1Y + dy; }
      if (p.cp2) { p.cp2.x = t.origCp2X + dx; p.cp2.y = t.origCp2Y + dy; }
      recalcBezierBounds(item);
    } else if (t.type === 'bez-tangent') {
      const p = item.points[t.nodeIndex];
      if (t.cpType === 'cp1') {
        p.cp1 = { x: pt.x, y: pt.y };
        if (p.smooth && p.cp2) {
          const dx = pt.x - p.x;
          const dy = pt.y - p.y;
          const len2 = Math.hypot(p.cp2.x - p.x, p.cp2.y - p.y) || 1;
          const len1 = Math.hypot(dx, dy) || 1;
          p.cp2 = { x: p.x - (dx / len1) * len2, y: p.y - (dy / len1) * len2 };
        }
      } else if (t.cpType === 'cp2') {
        p.cp2 = { x: pt.x, y: pt.y };
        if (p.smooth && p.cp1) {
          const dx = pt.x - p.x;
          const dy = pt.y - p.y;
          const len1 = Math.hypot(p.cp1.x - p.x, p.cp1.y - p.y) || 1;
          const len2 = Math.hypot(dx, dy) || 1;
          p.cp1 = { x: p.x - (dx / len2) * len1, y: p.y - (dy / len2) * len1 };
        }
      }
      recalcBezierBounds(item);
    } else if (t.type === 'bez-segment-curve') {
      const pA = item.points[t.idxA];
      const pB = item.points[t.idxB];
      const dx = pt.x - t.startX;
      const dy = pt.y - t.startY;

      pA.cp2 = { x: t.origCpA.x + dx, y: t.origCpA.y + dy };
      pB.cp1 = { x: t.origCpB.x + dx, y: t.origCpB.y + dy };

      recalcBezierBounds(item);
    }

    renderSvgElement(item);
    renderSelectionOverlay();
    updateInspector();
  }

  function handlePointerUp() {
    if (state.isPanning) {
      state.isPanning = false;
      dom.viewport.classList.remove('panning');
      return;
    }

    if (state.tool === 'bezier' && state.bezierDraft) {
      state.bezierDraft.draggingTangent = false;
      return;
    }

    if (state.transforming) {
      state.transforming = null;
      saveHistoryState();
      return;
    }

    if (state.isDrawing && state.currentDrawingShape) {
      const shape = state.currentDrawingShape;
      state.isDrawing = false;

      const minSize = (shape.type === 'line' || shape.type === 'connector-round')
        ? Math.hypot(shape.x2 - shape.x1, shape.y2 - shape.y1)
        : Math.max(shape.width, shape.height);

      if (minSize > 4) {
        state.elements.set(shape.id, shape);
        renderSvgElement(shape);
        selectElement(shape.id);
        saveHistoryState();
        setTool('select');
      } else {
        const el = document.getElementById(shape.id);
        if (el) el.remove();
      }

      state.currentDrawingShape = null;
    }
  }

  function applyCurrentDefaultStyles(shape) {
    const selected = getSelectedElement();
    if (selected) {
      shape.fillType = selected.fillType;
      shape.fillColor = selected.fillColor;
      shape.fillOpacity = selected.fillOpacity;
      shape.strokeColor = selected.strokeColor;
      shape.strokeWidth = selected.strokeWidth;
      shape.hasStroke = selected.hasStroke;
      if (selected.gradient) {
        shape.gradient.type = selected.gradient.type;
        shape.gradient.angle = selected.gradient.angle;
        shape.gradient.stop1 = selected.gradient.stop1;
        shape.gradient.stop2 = selected.gradient.stop2;
      }
    }
  }

  // =========================================================================
  // INSPECTOR & PROPERTIES PANEL
  // =========================================================================

  function updateInspector() {
    const item = getSelectedElement();

    if (!item) {
      dom.inspectorEmpty.style.display = 'flex';
      dom.inspectorActive.style.display = 'none';
      dom.selectedBadge.textContent = 'Nenhum objeto';
      if (dom.mobileSelectedDot) dom.mobileSelectedDot.classList.remove('active');
      if (dom.btnMobileInspector) dom.btnMobileInspector.classList.remove('has-selection');
      if (dom.mobileInspectorBtnText) dom.mobileInspectorBtnText.textContent = 'Propriedades';
      return;
    }

    dom.inspectorEmpty.style.display = 'none';
    dom.inspectorActive.style.display = 'flex';
    if (dom.mobileSelectedDot) dom.mobileSelectedDot.classList.add('active');
    if (dom.btnMobileInspector) dom.btnMobileInspector.classList.add('has-selection');
    if (dom.mobileInspectorBtnText) {
      dom.mobileInspectorBtnText.textContent = item.type === 'text' ? 'Editar Texto' : 'Editar Objeto';
    }

    // Type Badge
    let typeName = 'Objeto';
    if (item.type === 'rect') typeName = 'Quadro / Retângulo';
    else if (item.type === 'circle') typeName = 'Círculo / Elipse';
    else if (item.type === 'line') typeName = item.isCurved ? 'Curva Bézier (2pt)' : 'Conector de Linha Reta';
    else if (item.type === 'connector-round') typeName = 'Conector Redondo de Ângulo Reto';
    else if (item.type === 'bezier') typeName = item.closed ? `Forma Geométrica Bézier (${item.points ? item.points.length : 0} nós)` : `Caminho Bézier Aberto (${item.points ? item.points.length : 0} nós)`;
    else if (item.type === 'polygon') typeName = `Polígono (${item.polyPoints} pt)`;
    else if (item.type === 'text') typeName = 'Texto Vetorial';
    dom.selectedBadge.textContent = typeName;

    // Text Properties
    if (item.type === 'text' && dom.rowTextProps) {
      dom.rowTextProps.style.display = 'block';
      if (dom.propTextContent) dom.propTextContent.value = item.text !== undefined ? item.text : '';
      if (dom.propFontFamily) dom.propFontFamily.value = item.fontFamily || "'Inter', sans-serif";
      if (dom.propFontSizeInput) dom.propFontSizeInput.value = item.fontSize || 48;
      if (dom.propFontSizeSlider) dom.propFontSizeSlider.value = Math.min(180, item.fontSize || 48);
      if (dom.btnTextBold) dom.btnTextBold.classList.toggle('active', item.fontWeight === 'bold' || item.fontWeight >= 700);
      if (dom.btnTextItalic) dom.btnTextItalic.classList.toggle('active', item.fontStyle === 'italic');
      if (dom.btnAlignLeft) dom.btnAlignLeft.classList.toggle('active', !item.textAlign || item.textAlign === 'left');
      if (dom.btnAlignCenter) dom.btnAlignCenter.classList.toggle('active', item.textAlign === 'center');
      if (dom.btnAlignRight) dom.btnAlignRight.classList.toggle('active', item.textAlign === 'right');
    } else if (dom.rowTextProps) {
      dom.rowTextProps.style.display = 'none';
    }

    // Converter Quadro em Círculo
    if (item.type === 'rect') {
      dom.btnConvertShape.parentElement.style.display = 'block';
      dom.btnConvertText.textContent = 'Converter Quadro em Círculo';
    } else if (item.type === 'circle') {
      dom.btnConvertShape.parentElement.style.display = 'block';
      dom.btnConvertText.textContent = 'Converter Círculo em Quadro';
    } else {
      dom.btnConvertShape.parentElement.style.display = 'none';
    }

    // Linha de 2 Pontos (Curvatura)
    if (item.type === 'line') {
      dom.rowCurveLine.style.display = 'block';
      dom.rowCurveAmount.style.display = 'block';
      dom.btnCurveText.textContent = item.isCurved ? 'Converter em Linha Reta' : 'Curvar Reta';
      dom.curveAmountSlider.value = item.curvature || 0;
      dom.curveAmountVal.textContent = `${item.curvature || 0}px`;
    } else {
      dom.rowCurveLine.style.display = 'none';
      dom.rowCurveAmount.style.display = 'none';
    }

    // Conector Redondo de Ângulo Reto
    if (item.type === 'connector-round') {
      dom.rowConnectorRound.style.display = 'block';
      dom.connectorRoundSlider.value = item.roundRadius !== undefined ? item.roundRadius : 20;
      dom.connectorRoundVal.textContent = `${item.roundRadius || 0}px`;
    } else {
      dom.rowConnectorRound.style.display = 'none';
    }

    // Caminho Bézier & Edição de Nós
    if (item.type === 'bezier') {
      dom.rowBezier.style.display = 'block';
      dom.btnBezierClosedText.textContent = item.closed ? 'Abrir Forma Geométrica' : 'Ligar Pontos (Criar Forma Geométrica)';

      if (dom.bezierNodePanel) {
        dom.bezierNodePanel.style.display = 'block';
        const numPts = item.points ? item.points.length : 0;
        const idx = state.selectedNodeIndex;

        if (idx !== null && idx >= 0 && idx < numPts) {
          const pt = item.points[idx];
          const hasCurv = !!(pt.cp1 || pt.cp2);
          dom.bezierSelectedNodeLabel.textContent = `Nó #${idx + 1} de ${numPts} (X: ${Math.round(pt.x)}, Y: ${Math.round(pt.y)})`;
          dom.bezierNodeStatus.textContent = hasCurv ? (pt.smooth ? 'Curva Suave' : 'Cúspide') : 'Canto Reto';
          dom.bezierNodeStatus.style.background = hasCurv ? 'rgba(16, 185, 129, 0.2)' : 'rgba(234, 179, 8, 0.2)';
          dom.bezierNodeStatus.style.color = hasCurv ? '#34d399' : '#fbbf24';

          dom.btnBezierCurveNode.disabled = false;
          dom.btnBezierStraightenNode.disabled = !hasCurv;
          dom.btnBezierSmoothNode.disabled = !hasCurv;
          dom.btnBezierDeleteNode.disabled = numPts <= 2;
        } else {
          dom.bezierSelectedNodeLabel.textContent = `Clique em um nó na tela (${numPts} nós)`;
          dom.bezierNodeStatus.textContent = 'Nenhum nó ativo';
          dom.bezierNodeStatus.style.background = 'rgba(255, 255, 255, 0.1)';
          dom.bezierNodeStatus.style.color = 'var(--text-muted)';

          dom.btnBezierCurveNode.disabled = false;
          dom.btnBezierStraightenNode.disabled = false;
          dom.btnBezierSmoothNode.disabled = false;
          dom.btnBezierDeleteNode.disabled = numPts <= 2;
        }
      }
    } else {
      dom.rowBezier.style.display = 'none';
      if (dom.bezierNodePanel) dom.bezierNodePanel.style.display = 'none';
    }

    // Corner Rounding (Rect)
    if (item.type === 'rect') {
      dom.rowCorners.style.display = 'block';
      const maxRadius = Math.round(Math.min(item.width, item.height) / 2);
      dom.cornerRadiusSlider.max = maxRadius || 100;
      dom.cornerRadiusSlider.value = item.cornerRadius || 0;
      dom.cornerRadiusVal.textContent = `${item.cornerRadius || 0}px`;
    } else {
      dom.rowCorners.style.display = 'none';
    }

    // Polygon Points
    if (item.type === 'polygon') {
      dom.rowPolyPoints.style.display = 'block';
      dom.polyPointsSlider.value = item.polyPoints || 5;
      dom.polyPointsVal.textContent = item.polyPoints || 5;
    } else {
      dom.rowPolyPoints.style.display = 'none';
    }

    // Geometry fields
    dom.propX.value = Math.round(item.x || 0);
    dom.propY.value = Math.round(item.y || 0);
    dom.propW.value = Math.round(item.width || 0);
    dom.propH.value = Math.round(item.height || 0);
    dom.propRotation.value = item.rotation || 0;
    dom.propRotationVal.textContent = `${item.rotation || 0}°`;

    // Invert / Flip Button States
    if (dom.btnFlipH) dom.btnFlipH.classList.toggle('active', !!item.flipH);
    if (dom.btnFlipV) dom.btnFlipV.classList.toggle('active', !!item.flipV);

    // Aspect Ratio Lock
    if (dom.btnLockAspect) {
      dom.btnLockAspect.classList.toggle('active', !!state.lockAspectRatio);
      if (dom.aspectLockText) {
        dom.aspectLockText.textContent = state.lockAspectRatio ? 'Proporcional' : 'Livre';
      }
    }

    // Fill settings
    const fillMode = item.fillType || 'solid';
    dom.fillModeSolid.classList.toggle('active', fillMode === 'solid');
    dom.fillModeGradient.classList.toggle('active', fillMode === 'gradient');
    dom.fillModeNone.classList.toggle('active', fillMode === 'none');

    dom.fillSolidControls.style.display = fillMode === 'solid' ? 'block' : 'none';
    dom.fillGradientControls.style.display = fillMode === 'gradient' ? 'block' : 'none';

    dom.propFillColor.value = item.fillColor || '#3b82f6';
    dom.propFillColorHex.value = item.fillColor || '#3b82f6';
    dom.propFillOpacity.value = Math.round((item.fillOpacity !== undefined ? item.fillOpacity : 1) * 100);

    // Gradient settings
    if (item.gradient) {
      const gradRadio = document.querySelector(`input[name="gradient-type"][value="${item.gradient.type}"]`);
      if (gradRadio) gradRadio.checked = true;

      dom.gradStop1Color.value = item.gradient.stop1;
      dom.gradStop1Hex.textContent = item.gradient.stop1;
      dom.gradStop2Color.value = item.gradient.stop2;
      dom.gradStop2Hex.textContent = item.gradient.stop2;

      dom.gradAngleSlider.value = item.gradient.angle;
      dom.gradAngleVal.textContent = `${item.gradient.angle}°`;
      dom.gradAngleWrapper.style.display = item.gradient.type === 'linear' ? 'block' : 'none';

      updateGradientPreview(item.gradient);
    }

    // Stroke settings
    dom.propStrokeColor.value = item.strokeColor || '#ffffff';
    dom.propStrokeColorHex.value = item.strokeColor || '#ffffff';
    dom.propStrokeWidth.value = item.hasStroke ? (item.strokeWidth || 2) : 0;
    dom.propStrokeDash.value = item.strokeDash || 'solid';
    dom.propStrokeCap.value = item.strokeCap || 'round';
    dom.btnToggleStroke.textContent = item.hasStroke ? 'Sem Traço' : 'Ativar Traço';
  }

  function updateGradientPreview(grad) {
    if (grad.type === 'radial') {
      dom.gradientPreviewBar.style.background = `radial-gradient(circle, ${grad.stop1} 0%, ${grad.stop2} 100%)`;
    } else {
      dom.gradientPreviewBar.style.background = `linear-gradient(${grad.angle}deg, ${grad.stop1} 0%, ${grad.stop2} 100%)`;
    }
  }

  // =========================================================================
  // PALETTE & SWATCHES DOCK
  // =========================================================================

  function setupPalette() {
    dom.btnTargetFill.addEventListener('click', () => {
      state.colorTarget = 'fill';
      dom.btnTargetFill.classList.add('active');
      dom.btnTargetStroke.classList.remove('active');
    });

    dom.btnTargetStroke.addEventListener('click', () => {
      state.colorTarget = 'stroke';
      dom.btnTargetStroke.classList.add('active');
      dom.btnTargetFill.classList.remove('active');
    });

    document.querySelectorAll('.swatch-item').forEach(swatch => {
      swatch.addEventListener('click', () => {
        const color = swatch.dataset.color;
        const gradientData = swatch.dataset.gradient;

        if (gradientData) {
          applyGradientFromPreset(gradientData);
        } else if (color === 'none') {
          applyColorNone();
        } else if (color) {
          applySolidColor(color);
        }
      });
    });

    dom.quickCustomColor.addEventListener('input', (e) => {
      applySolidColor(e.target.value);
    });
  }

  function applySolidColor(hex) {
    const item = getSelectedElement();
    if (!item) return;

    if (state.colorTarget === 'fill') {
      if (item.type === 'bezier') {
        item.closed = true;
      }
      item.fillType = 'solid';
      item.fillColor = hex;
      item.fillOpacity = 1;
    } else {
      item.hasStroke = true;
      item.strokeColor = hex;
      if (!item.strokeWidth || item.strokeWidth === 0) item.strokeWidth = 3;
    }

    renderSvgElement(item);
    renderSelectionOverlay();
    updateInspector();
    saveHistoryState();
  }

  function applyColorNone() {
    const item = getSelectedElement();
    if (!item) return;

    if (state.colorTarget === 'fill') {
      item.fillType = 'none';
    } else {
      item.hasStroke = false;
    }

    renderSvgElement(item);
    renderSelectionOverlay();
    updateInspector();
    saveHistoryState();
  }

  function applyGradientFromPreset(gradStr) {
    const parts = gradStr.split('-');
    const type = parts[0];
    const angle = parseInt(parts[1], 10) || 90;
    const stop1 = parts[2];
    const stop2 = parts[3];

    const item = getSelectedElement();
    if (!item) return;

    if (item.type === 'bezier') {
      item.closed = true;
    }
    item.fillType = 'gradient';
    if (!item.gradient) {
      item.gradient = { id: `grad_${item.id}`, type: 'linear', angle: 90, stop1: '#06b6d4', stop2: '#8b5cf6' };
    }
    item.gradient.type = type;
    item.gradient.angle = angle;
    item.gradient.stop1 = stop1;
    item.gradient.stop2 = stop2;

    renderSvgElement(item);
    renderSelectionOverlay();
    updateInspector();
    saveHistoryState();
  }

  // =========================================================================
  // HISTORY (UNDO / REDO)
  // =========================================================================

  function saveHistoryState() {
    if (state.historyIndex < state.history.length - 1) {
      state.history = state.history.slice(0, state.historyIndex + 1);
    }

    const snapshot = Array.from(state.elements.values()).map(el => JSON.parse(JSON.stringify(el)));
    state.history.push({
      elements: snapshot,
      nextId: state.nextId,
      docWidth: state.docWidth,
      docHeight: state.docHeight
    });

    if (state.history.length > 40) state.history.shift();
    else state.historyIndex++;

    updateUndoRedoButtons();
  }

  function undo() {
    if (state.historyIndex > 0) {
      state.historyIndex--;
      restoreHistoryState(state.history[state.historyIndex]);
      showToast('Desfeito');
    }
  }

  function redo() {
    if (state.historyIndex < state.history.length - 1) {
      state.historyIndex++;
      restoreHistoryState(state.history[state.historyIndex]);
      showToast('Refeito');
    }
  }

  function restoreHistoryState(record) {
    if (record.docWidth && record.docHeight && (record.docWidth !== state.docWidth || record.docHeight !== state.docHeight)) {
      setDocumentDimensions(record.docWidth, record.docHeight, true);
    }

    dom.shapesLayer.innerHTML = '';
    state.elements.clear();
    state.nextId = record.nextId;

    record.elements.forEach(item => {
      state.elements.set(item.id, JSON.parse(JSON.stringify(item)));
      renderSvgElement(item);
    });

    if (state.selectedId && !state.elements.has(state.selectedId)) {
      state.selectedId = null;
    }

    renderSelectionOverlay();
    updateInspector();
    updateUndoRedoButtons();
  }

  function updateUndoRedoButtons() {
    dom.btnUndo.disabled = state.historyIndex <= 0;
    dom.btnRedo.disabled = state.historyIndex >= state.history.length - 1;
    dom.btnUndo.style.opacity = dom.btnUndo.disabled ? '0.4' : '1';
    dom.btnRedo.style.opacity = dom.btnRedo.disabled ? '0.4' : '1';
  }

  // =========================================================================
  // ACTIONS: ARRANGE, DUPLICATE, DELETE
  // =========================================================================

  function bringToFront() {
    const item = getSelectedElement();
    if (!item) return;

    const el = document.getElementById(item.id);
    if (el && el.parentNode) {
      el.parentNode.appendChild(el);
      state.elements.delete(item.id);
      state.elements.set(item.id, item);
      saveHistoryState();
      showToast('Objeto trazido para frente');
    }
  }

  function sendToBack() {
    const item = getSelectedElement();
    if (!item) return;

    const el = document.getElementById(item.id);
    if (el && el.parentNode) {
      el.parentNode.insertBefore(el, el.parentNode.firstChild);
      const entries = Array.from(state.elements.entries());
      const itemEntry = [item.id, item];
      const newEntries = [itemEntry, ...entries.filter(([k]) => k !== item.id)];
      state.elements = new Map(newEntries);
      saveHistoryState();
      showToast('Objeto enviado para trás');
    }
  }

  function duplicateSelected() {
    const item = getSelectedElement();
    if (!item) return;

    const clone = JSON.parse(JSON.stringify(item));
    clone.id = `shape_${state.nextId++}`;
    clone.x += 20;
    clone.y += 20;

    if (clone.type === 'line' || clone.type === 'connector-round') {
      clone.x1 += 20; clone.y1 += 20;
      clone.x2 += 20; clone.y2 += 20;
      if (clone.cx !== undefined) clone.cx += 20;
      if (clone.cy !== undefined) clone.cy += 20;
    } else if (clone.type === 'bezier') {
      clone.points.forEach(p => {
        p.x += 20; p.y += 20;
        if (p.cp1) { p.cp1.x += 20; p.cp1.y += 20; }
        if (p.cp2) { p.cp2.x += 20; p.cp2.y += 20; }
      });
    }

    if (clone.gradient) clone.gradient.id = `grad_${clone.id}`;

    state.elements.set(clone.id, clone);
    renderSvgElement(clone);
    selectElement(clone.id);
    saveHistoryState();
    showToast('Objeto duplicado!');
  }

  function deleteSelected() {
    const item = getSelectedElement();
    if (!item) return;

    const el = document.getElementById(item.id);
    if (el) el.remove();

    if (item.gradient) {
      const gDef = document.getElementById(item.gradient.id);
      if (gDef) gDef.remove();
    }

    state.elements.delete(item.id);
    clearSelection();
    saveHistoryState();
    showToast('Objeto excluído');
  }

  // =========================================================================
  // FLIP / INVERT OBJECTS (HORIZONTAL & VERTICAL)
  // =========================================================================

  function flipSelectedObject(direction) {
    const item = getSelectedElement();
    if (!item) {
      showToast('Selecione um objeto para inverter!');
      return;
    }

    if (direction === 'horizontal') {
      if (item.type === 'line') {
        const mx = (item.x1 + item.x2) / 2;
        const tempX1 = item.x1;
        item.x1 = item.x2;
        item.x2 = tempX1;
        item.curvature = -item.curvature;
        recalcLineBoundsAndCurve(item);
      } else if (item.type === 'connector-round') {
        const tempX1 = item.x1;
        item.x1 = item.x2;
        item.x2 = tempX1;
        item.elbowRatio = 1 - (item.elbowRatio || 0.5);
      } else if (item.type === 'bezier') {
        const cx = item.x + item.width / 2;
        if (item.points) {
          item.points.forEach(p => {
            p.x = 2 * cx - p.x;
            if (p.cp1) p.cp1.x = 2 * cx - p.cp1.x;
            if (p.cp2) p.cp2.x = 2 * cx - p.cp2.x;
          });
        }
        recalcBezierBounds(item);
      } else {
        item.flipH = !item.flipH;
      }
      showToast('Objeto invertido horizontalmente!');
    } else if (direction === 'vertical') {
      if (item.type === 'line') {
        const my = (item.y1 + item.y2) / 2;
        const tempY1 = item.y1;
        item.y1 = item.y2;
        item.y2 = tempY1;
        item.curvature = -item.curvature;
        recalcLineBoundsAndCurve(item);
      } else if (item.type === 'connector-round') {
        const tempY1 = item.y1;
        item.y1 = item.y2;
        item.y2 = tempY1;
        item.elbowRatio = 1 - (item.elbowRatio || 0.5);
      } else if (item.type === 'bezier') {
        const cy = item.y + item.height / 2;
        if (item.points) {
          item.points.forEach(p => {
            p.y = 2 * cy - p.y;
            if (p.cp1) p.cp1.y = 2 * cy - p.cp1.y;
            if (p.cp2) p.cp2.y = 2 * cy - p.cp2.y;
          });
        }
        recalcBezierBounds(item);
      } else {
        item.flipV = !item.flipV;
      }
      showToast('Objeto invertido verticalmente!');
    }

    renderSvgElement(item);
    renderSelectionOverlay();
    updateInspector();
    saveHistoryState();
  }

  // =========================================================================
  // SCALE / RESIZE OBJECTS (PRESETS & PROPORTIONAL)
  // =========================================================================

  function scaleSelectedObject(factor, notify = true) {
    const item = getSelectedElement();
    if (!item) {
      if (notify) showToast('Selecione um objeto para redimensionar!');
      return;
    }

    if (!factor || factor <= 0 || isNaN(factor)) return;

    const cx = item.x + item.width / 2;
    const cy = item.y + item.height / 2;

    if (item.type === 'line') {
      const mx = (item.x1 + item.x2) / 2;
      const my = (item.y1 + item.y2) / 2;
      item.x1 = mx + (item.x1 - mx) * factor;
      item.y1 = my + (item.y1 - my) * factor;
      item.x2 = mx + (item.x2 - mx) * factor;
      item.y2 = my + (item.y2 - my) * factor;
      if (item.curvature) item.curvature *= factor;
      recalcLineBoundsAndCurve(item);
    } else if (item.type === 'connector-round') {
      const mx = (item.x1 + item.x2) / 2;
      const my = (item.y1 + item.y2) / 2;
      item.x1 = mx + (item.x1 - mx) * factor;
      item.y1 = my + (item.y1 - my) * factor;
      item.x2 = mx + (item.x2 - mx) * factor;
      item.y2 = my + (item.y2 - my) * factor;
      if (item.roundRadius) item.roundRadius = Math.max(0, Math.round(item.roundRadius * factor));
      item.x = Math.min(item.x1, item.x2);
      item.y = Math.min(item.y1, item.y2);
      item.width = Math.max(1, Math.abs(item.x2 - item.x1));
      item.height = Math.max(1, Math.abs(item.y2 - item.y1));
    } else if (item.type === 'bezier') {
      if (item.points) {
        item.points.forEach(p => {
          p.x = cx + (p.x - cx) * factor;
          p.y = cy + (p.y - cy) * factor;
          if (p.cp1) {
            p.cp1.x = cx + (p.cp1.x - cx) * factor;
            p.cp1.y = cy + (p.cp1.y - cy) * factor;
          }
          if (p.cp2) {
            p.cp2.x = cx + (p.cp2.x - cx) * factor;
            p.cp2.y = cy + (p.cp2.y - cy) * factor;
          }
        });
      }
      recalcBezierBounds(item);
    } else if (item.type === 'text') {
      item.fontSize = Math.max(8, Math.round((item.fontSize || 48) * factor));
      const newW = Math.max(10, Math.round(item.width * factor));
      const newH = Math.max(10, Math.round(item.height * factor));
      item.width = newW;
      item.height = newH;
      item.x = Math.round(cx - newW / 2);
      item.y = Math.round(cy - newH / 2);
    } else {
      // rect, circle, polygon
      const newW = Math.max(2, Math.round(item.width * factor));
      const newH = Math.max(2, Math.round(item.height * factor));
      item.width = newW;
      item.height = newH;
      item.x = Math.round(cx - newW / 2);
      item.y = Math.round(cy - newH / 2);
      if (item.cornerRadius) {
        item.cornerRadius = Math.max(0, Math.round(item.cornerRadius * factor));
      }
    }

    renderSvgElement(item);
    renderSelectionOverlay();
    updateInspector();
    saveHistoryState();

    if (notify) {
      const pct = Math.round(factor * 100);
      showToast(`Tamanho redimensionado (${pct}%)!`);
    }
  }

  function clearCanvas() {
    if (state.elements.size === 0) return;
    if (confirm('Deseja limpar todo o desenho atual?')) {
      dom.shapesLayer.innerHTML = '';
      state.elements.clear();
      cancelBezierDraft();
      clearSelection();
      saveHistoryState();
      showToast('Área de desenho limpa');
    }
  }

  // =========================================================================
  // EXPORT & SAVE (SVG & PROJECT JSON)
  // =========================================================================

  function exportSVG() {
    const title = (dom.docTitle.value || 'desenho_vetorial').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const clone = dom.svg.cloneNode(true);
    clone.querySelector('#preview-layer')?.remove();
    clone.querySelector('#selection-layer')?.remove();
    clone.querySelector('#canvas-grid')?.remove();
    clone.querySelector('#canvas-bg')?.remove();
    clone.querySelectorAll('.hit-stroke').forEach(h => h.remove());

    // Remove grid patterns so they don't bloat the SVG or cause phantom elements on import
    clone.querySelector('#grid-pattern-small')?.remove();
    clone.querySelector('#grid-pattern-large')?.remove();

    // Embed project metadata for 100% lossless re-import in Vector Studio
    const projectData = {
      version: '1.0',
      title: (dom.docTitle.value || 'desenho_vetorial').trim(),
      docWidth: state.docWidth,
      docHeight: state.docHeight,
      date: new Date().toISOString(),
      elements: Array.from(state.elements.values()),
      nextId: state.nextId
    };

    const meta = document.createElementNS('http://www.w3.org/2000/svg', 'metadata');
    meta.id = 'vector-studio-project';
    meta.textContent = JSON.stringify(projectData);
    clone.insertBefore(meta, clone.firstChild);

    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    clone.setAttribute('version', '1.1');

    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(clone);

    const xmlHeader = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n';
    svgString = xmlHeader + svgString;

    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Arquivo vetorial ${title}.svg salvo com sucesso! Compatível com CorelDraw.`);
  }

  function exportPNG() {
    const title = (dom.docTitle.value || 'desenho_vetorial').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const clone = dom.svg.cloneNode(true);
    clone.querySelector('#preview-layer')?.remove();
    clone.querySelector('#selection-layer')?.remove();
    clone.querySelector('#canvas-grid')?.remove();
    clone.querySelectorAll('.hit-stroke').forEach(h => h.remove());
    clone.querySelector('#grid-pattern-small')?.remove();
    clone.querySelector('#grid-pattern-large')?.remove();

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clone);
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = state.docWidth;
      canvas.height = state.docHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${title}.png`;
        link.click();
        URL.revokeObjectURL(url);
        showToast('Imagem PNG gerada!');
      });
    };
    img.src = url;
  }

  function saveProject() {
    const title = (dom.docTitle.value || 'desenho_vetorial').trim();
    const project = {
      version: '1.0',
      title,
      docWidth: state.docWidth,
      docHeight: state.docHeight,
      date: new Date().toISOString(),
      elements: Array.from(state.elements.values()),
      nextId: state.nextId
    };

    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title}.vector.json`;
    link.click();
    showToast('Projeto salvo em arquivo!');
  }

  function openFile(file) {
    const reader = new FileReader();
    if (file.name.endsWith('.json')) {
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (data.docWidth && data.docHeight) {
            setDocumentDimensions(data.docWidth, data.docHeight, true);
          }
          if (data.elements) {
            cancelBezierDraft();
            clearSelection();
            restoreHistoryState(data);
            if (data.title) dom.docTitle.value = data.title;
            else dom.docTitle.value = file.name.replace(/\.vector\.json$|\.json$/, '');
            showToast('Projeto carregado com sucesso!');
          }
        } catch (err) {
          alert('Erro ao carregar o arquivo de projeto JSON.');
        }
      };
      reader.readAsText(file);
    } else if (file.name.endsWith('.svg')) {
      reader.onload = (e) => {
        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(e.target.result, 'image/svg+xml');
          const fileTitle = file.name.replace(/\.svg$/i, '');
          const count = parseImportedSvg(doc, fileTitle);
          showToast(`SVG importado com sucesso! (${count} objeto${count === 1 ? '' : 's'})`);
        } catch (err) {
          console.error('Erro ao processar SVG:', err);
          alert('Erro ao carregar o arquivo SVG.');
        }
      };
      reader.readAsText(file);
    }
  }

  // Parse SVG path "d" string into Bézier node points and closed flag
  function parseSvgPathD(d) {
    if (!d || typeof d !== 'string') return { points: [], closed: false };

    const regex = /([a-df-z])|([-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?)/gi;
    const tokens = [];
    let m;
    while ((m = regex.exec(d)) !== null) {
      tokens.push(m[0]);
    }

    let i = 0;
    let currentX = 0;
    let currentY = 0;
    let startX = 0;
    let startY = 0;
    const points = [];
    let closed = false;
    let lastCommand = '';
    let prevCp2 = null;

    while (i < tokens.length) {
      let token = tokens[i];
      let isCommand = /^[a-df-z]$/i.test(token);
      let cmd = isCommand ? token : lastCommand;
      if (isCommand) i++;

      if (!cmd) break;

      const isRel = cmd === cmd.toLowerCase();
      const upper = cmd.toUpperCase();
      lastCommand = cmd;

      if (upper === 'M') {
        const x = (isRel ? currentX : 0) + parseFloat(tokens[i++]);
        const y = (isRel ? currentY : 0) + parseFloat(tokens[i++]);
        currentX = x;
        currentY = y;
        startX = x;
        startY = y;
        points.push({ x, y, cp1: null, cp2: null, smooth: false });
        prevCp2 = null;
        lastCommand = isRel ? 'l' : 'L';
      } else if (upper === 'L') {
        const x = (isRel ? currentX : 0) + parseFloat(tokens[i++]);
        const y = (isRel ? currentY : 0) + parseFloat(tokens[i++]);
        currentX = x;
        currentY = y;
        points.push({ x, y, cp1: null, cp2: null, smooth: false });
        prevCp2 = null;
      } else if (upper === 'H') {
        const x = (isRel ? currentX : 0) + parseFloat(tokens[i++]);
        currentX = x;
        points.push({ x, y: currentY, cp1: null, cp2: null, smooth: false });
        prevCp2 = null;
      } else if (upper === 'V') {
        const y = (isRel ? currentY : 0) + parseFloat(tokens[i++]);
        currentY = y;
        points.push({ x: currentX, y, cp1: null, cp2: null, smooth: false });
        prevCp2 = null;
      } else if (upper === 'C') {
        const cp1x = (isRel ? currentX : 0) + parseFloat(tokens[i++]);
        const cp1y = (isRel ? currentY : 0) + parseFloat(tokens[i++]);
        const cp2x = (isRel ? currentX : 0) + parseFloat(tokens[i++]);
        const cp2y = (isRel ? currentY : 0) + parseFloat(tokens[i++]);
        const x = (isRel ? currentX : 0) + parseFloat(tokens[i++]);
        const y = (isRel ? currentY : 0) + parseFloat(tokens[i++]);

        if (points.length > 0) {
          points[points.length - 1].cp2 = { x: cp1x, y: cp1y };
        }
        points.push({
          x,
          y,
          cp1: { x: cp2x, y: cp2y },
          cp2: null,
          smooth: true
        });
        prevCp2 = { x: cp2x, y: cp2y };
        currentX = x;
        currentY = y;
      } else if (upper === 'S') {
        let cp1x = currentX;
        let cp1y = currentY;
        if (prevCp2) {
          cp1x = 2 * currentX - prevCp2.x;
          cp1y = 2 * currentY - prevCp2.y;
        }
        const cp2x = (isRel ? currentX : 0) + parseFloat(tokens[i++]);
        const cp2y = (isRel ? currentY : 0) + parseFloat(tokens[i++]);
        const x = (isRel ? currentX : 0) + parseFloat(tokens[i++]);
        const y = (isRel ? currentY : 0) + parseFloat(tokens[i++]);

        if (points.length > 0) {
          points[points.length - 1].cp2 = { x: cp1x, y: cp1y };
        }
        points.push({
          x,
          y,
          cp1: { x: cp2x, y: cp2y },
          cp2: null,
          smooth: true
        });
        prevCp2 = { x: cp2x, y: cp2y };
        currentX = x;
        currentY = y;
      } else if (upper === 'Q') {
        const qx = (isRel ? currentX : 0) + parseFloat(tokens[i++]);
        const qy = (isRel ? currentY : 0) + parseFloat(tokens[i++]);
        const x = (isRel ? currentX : 0) + parseFloat(tokens[i++]);
        const y = (isRel ? currentY : 0) + parseFloat(tokens[i++]);

        const cp1x = currentX + (2 / 3) * (qx - currentX);
        const cp1y = currentY + (2 / 3) * (qy - currentY);
        const cp2x = x + (2 / 3) * (qx - x);
        const cp2y = y + (2 / 3) * (qy - y);

        if (points.length > 0) {
          points[points.length - 1].cp2 = { x: cp1x, y: cp1y };
        }
        points.push({
          x,
          y,
          cp1: { x: cp2x, y: cp2y },
          cp2: null,
          smooth: true
        });
        prevCp2 = { x: cp2x, y: cp2y };
        currentX = x;
        currentY = y;
      } else if (upper === 'T') {
        let qx = currentX;
        let qy = currentY;
        if (prevCp2) {
          qx = 2 * currentX - prevCp2.x;
          qy = 2 * currentY - prevCp2.y;
        }
        const x = (isRel ? currentX : 0) + parseFloat(tokens[i++]);
        const y = (isRel ? currentY : 0) + parseFloat(tokens[i++]);

        const cp1x = currentX + (2 / 3) * (qx - currentX);
        const cp1y = currentY + (2 / 3) * (qy - currentY);
        const cp2x = x + (2 / 3) * (qx - x);
        const cp2y = y + (2 / 3) * (qy - y);

        if (points.length > 0) {
          points[points.length - 1].cp2 = { x: cp1x, y: cp1y };
        }
        points.push({
          x,
          y,
          cp1: { x: cp2x, y: cp2y },
          cp2: null,
          smooth: true
        });
        prevCp2 = { x: cp2x, y: cp2y };
        currentX = x;
        currentY = y;
      } else if (upper === 'A') {
        const rx = parseFloat(tokens[i++]);
        const ry = parseFloat(tokens[i++]);
        const rot = parseFloat(tokens[i++]);
        const laf = parseFloat(tokens[i++]);
        const sf = parseFloat(tokens[i++]);
        const x = (isRel ? currentX : 0) + parseFloat(tokens[i++]);
        const y = (isRel ? currentY : 0) + parseFloat(tokens[i++]);
        points.push({ x, y, cp1: null, cp2: null, smooth: false });
        prevCp2 = null;
        currentX = x;
        currentY = y;
      } else if (upper === 'Z') {
        closed = true;
        currentX = startX;
        currentY = startY;
        prevCp2 = null;
        if (points.length > 1) {
          const first = points[0];
          const last = points[points.length - 1];
          if (Math.hypot(last.x - first.x, last.y - first.y) < 1.5) {
            if (last.cp1 && !first.cp1) first.cp1 = last.cp1;
            points.pop();
          }
        }
      } else {
        i++;
      }
    }

    return { points, closed };
  }

  // Parse SVG polygon/polyline points string
  function parseSvgPoints(pointsStr) {
    if (!pointsStr || typeof pointsStr !== 'string') return [];
    const coords = pointsStr.trim().split(/[\s,]+/).map(parseFloat).filter(n => !isNaN(n));
    const pts = [];
    for (let i = 0; i < coords.length - 1; i += 2) {
      pts.push({ x: coords[i], y: coords[i + 1], cp1: null, cp2: null, smooth: false });
    }
    return pts;
  }

  function parseImportedSvg(doc, fileTitle) {
    // 1. Check for embedded Vector Studio project metadata first
    const metaEl = doc.querySelector('#vector-studio-project, #vector-studio-data, metadata[id="vector-studio-project"], desc[id="vector-studio-data"]');
    if (metaEl && metaEl.textContent && metaEl.textContent.trim()) {
      try {
        const project = JSON.parse(metaEl.textContent.trim());
        if (project && Array.isArray(project.elements)) {
          if (project.docWidth && project.docHeight) {
            setDocumentDimensions(project.docWidth, project.docHeight, true);
          }
          cancelBezierDraft();
          clearSelection();
          restoreHistoryState(project);
          if (project.title && dom.docTitle) dom.docTitle.value = project.title;
          else if (fileTitle && dom.docTitle) dom.docTitle.value = fileTitle;
          saveHistoryState();
          return project.elements.length;
        }
      } catch (err) {
        console.warn('Erro ao restaurar metadados do Vector Studio, utilizando analisador padrão:', err);
      }
    }

    // 2. Fallback / Standard SVG Parser
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      alert('O arquivo SVG contém erros de formatação XML e não pôde ser aberto.');
      return 0;
    }

    const rootSvg = doc.querySelector('svg');
    if (rootSvg) {
      let w = parseFloat(rootSvg.getAttribute('width'));
      let h = parseFloat(rootSvg.getAttribute('height'));
      if ((!w || !h || isNaN(w) || isNaN(h)) && rootSvg.getAttribute('viewBox')) {
        const vb = rootSvg.getAttribute('viewBox').trim().split(/[\s,]+/).map(parseFloat);
        if (vb.length === 4 && vb[2] > 0 && vb[3] > 0) {
          w = vb[2];
          h = vb[3];
        }
      }
      if (w > 0 && h > 0) {
        setDocumentDimensions(w, h, true);
      }
    }

    if (fileTitle && dom.docTitle) {
      dom.docTitle.value = fileTitle;
    }

    cancelBezierDraft();
    clearSelection();
    dom.shapesLayer.innerHTML = '';
    state.elements.clear();

    // Copy any linear/radial gradients from SVG defs to dom.svgDefs so gradient fills resolve
    const importedGradients = doc.querySelectorAll('linearGradient, radialGradient');
    importedGradients.forEach(grad => {
      const existing = dom.svgDefs.querySelector(`#${grad.id}`);
      if (existing) existing.remove();
      dom.svgDefs.appendChild(grad.cloneNode(true));
    });

    // Select shape elements: if #shapes-layer exists, read directly from it; otherwise select visual shapes outside defs
    const shapesLayerInDoc = doc.querySelector('#shapes-layer');
    let shapeNodes = [];
    if (shapesLayerInDoc) {
      shapeNodes = Array.from(shapesLayerInDoc.querySelectorAll('rect, circle, ellipse, line, path, polygon, polyline, text'));
    } else {
      shapeNodes = Array.from(doc.querySelectorAll('rect, circle, ellipse, line, path, polygon, polyline, text')).filter(el => {
        return !el.closest('defs, pattern, clipPath, mask, symbol, metadata, style');
      });
    }

    let importedCount = 0;

    shapeNodes.forEach(el => {
      const tag = el.tagName.toLowerCase();
      // Skip canvas background, grid background, and hit stroke interaction paths
      if (el.id === 'canvas-bg' || el.id === 'canvas-grid' || el.classList.contains('hit-stroke')) return;
      if (el.closest('#preview-layer, #selection-layer')) return;

      const id = `shape_${state.nextId++}`;
      let item = null;

      if (tag === 'rect') {
        item = createNewShape('rect', 0, 0);
        item.id = id;
        item.x = parseFloat(el.getAttribute('x') || 0);
        item.y = parseFloat(el.getAttribute('y') || 0);
        item.width = parseFloat(el.getAttribute('width') || 100);
        item.height = parseFloat(el.getAttribute('height') || 100);
        item.cornerRadius = parseFloat(el.getAttribute('rx') || el.getAttribute('ry') || 0);
      } else if (tag === 'circle' || tag === 'ellipse') {
        item = createNewShape('circle', 0, 0);
        item.id = id;
        const rx = parseFloat(el.getAttribute('r') || el.getAttribute('rx') || 50);
        const ry = parseFloat(el.getAttribute('r') || el.getAttribute('ry') || rx);
        const cx = parseFloat(el.getAttribute('cx') || rx);
        const cy = parseFloat(el.getAttribute('cy') || ry);
        item.x = cx - rx;
        item.y = cy - ry;
        item.width = rx * 2;
        item.height = ry * 2;
      } else if (tag === 'line') {
        item = createNewShape('line', 0, 0);
        item.id = id;
        item.x1 = parseFloat(el.getAttribute('x1') || 0);
        item.y1 = parseFloat(el.getAttribute('y1') || 0);
        item.x2 = parseFloat(el.getAttribute('x2') || 100);
        item.y2 = parseFloat(el.getAttribute('y2') || 100);
        item.isCurved = false;
        recalcLineBoundsAndCurve(item);
      } else if (tag === 'path') {
        const d = el.getAttribute('d');
        if (!d) return;
        const parsed = parseSvgPathD(d);
        if (!parsed.points || parsed.points.length === 0) return;

        item = createNewShape('bezier', parsed.points[0].x, parsed.points[0].y);
        item.id = id;
        item.points = parsed.points;
        item.closed = parsed.closed;
        recalcBezierBounds(item);
      } else if (tag === 'polygon' || tag === 'polyline') {
        const pts = parseSvgPoints(el.getAttribute('points'));
        if (!pts || pts.length < 2) return;

        item = createNewShape('bezier', pts[0].x, pts[0].y);
        item.id = id;
        item.points = pts;
        item.closed = tag === 'polygon';
        recalcBezierBounds(item);
      } else if (tag === 'text') {
        item = createNewShape('text', 0, 0);
        item.id = id;
        item.x = parseFloat(el.getAttribute('x') || 0);
        item.y = parseFloat(el.getAttribute('y') || 0);
        item.text = el.textContent || 'Texto';
        item.fontSize = parseFloat(el.getAttribute('font-size') || 48);
        item.fontFamily = el.getAttribute('font-family') || "'Inter', sans-serif";
        item.fontWeight = el.getAttribute('font-weight') || 'bold';
        item.fontStyle = el.getAttribute('font-style') || 'normal';
        const anchor = el.getAttribute('text-anchor');
        item.textAlign = anchor === 'middle' ? 'center' : (anchor === 'end' ? 'right' : 'left');
      }

      if (!item) return;

      function getStyleVal(node, attr) {
        if (!node) return null;
        if (node.getAttribute && node.getAttribute(attr)) return node.getAttribute(attr);
        if (node.style && node.style.getPropertyValue(attr)) return node.style.getPropertyValue(attr);
        return null;
      }

      const fill = getStyleVal(el, 'fill') || (el.parentElement ? getStyleVal(el.parentElement, 'fill') : null);
      if (fill && fill !== 'none') {
        if (fill.startsWith('url(')) {
          const gradIdMatch = fill.match(/#([^"')]+)/);
          if (gradIdMatch) {
            item.fillType = 'gradient';
            item.gradient.id = gradIdMatch[1];
          } else {
            item.fillType = 'solid';
            item.fillColor = '#3b82f6';
          }
        } else {
          item.fillType = 'solid';
          item.fillColor = fill;
        }
      } else if (fill === 'none') {
        item.fillType = 'none';
      } else {
        if (item.type === 'line' || (item.type === 'bezier' && !item.closed)) {
          item.fillType = 'none';
        } else {
          item.fillType = 'solid';
        }
      }

      const fillOpacity = getStyleVal(el, 'fill-opacity') || getStyleVal(el, 'opacity');
      if (fillOpacity !== null && fillOpacity !== undefined) {
        const fo = parseFloat(fillOpacity);
        if (!isNaN(fo)) item.fillOpacity = fo;
      }

      const stroke = getStyleVal(el, 'stroke') || (el.parentElement ? getStyleVal(el.parentElement, 'stroke') : null);
      if (stroke && stroke !== 'none') {
        item.hasStroke = true;
        item.strokeColor = stroke;
        const sw = parseFloat(getStyleVal(el, 'stroke-width') || (el.parentElement ? getStyleVal(el.parentElement, 'stroke-width') : 0));
        if (!isNaN(sw) && sw > 0) item.strokeWidth = sw;
        const cap = getStyleVal(el, 'stroke-linecap');
        if (cap) item.strokeCap = cap;
        const dash = getStyleVal(el, 'stroke-dasharray');
        if (dash && dash !== 'none') {
          item.strokeDash = dash.includes(' ') ? 'dashed' : 'solid';
        }
      } else if (stroke === 'none') {
        item.hasStroke = false;
        item.strokeWidth = 0;
      }

      const transform = el.getAttribute('transform') || (el.parentElement ? el.parentElement.getAttribute('transform') : null);
      if (transform) {
        const rotMatch = transform.match(/rotate\(\s*([-\d.]+)/);
        if (rotMatch) {
          item.rotation = parseFloat(rotMatch[1]) || 0;
        }
        const transMatch = transform.match(/translate\(\s*([-\d.]+)(?:[\s,]+([-\d.]+))?\)/);
        if (transMatch) {
          const tx = parseFloat(transMatch[1]) || 0;
          const ty = parseFloat(transMatch[2]) || 0;
          if (item.type === 'rect' || item.type === 'circle' || item.type === 'text') {
            item.x += tx;
            item.y += ty;
          } else if (item.type === 'line') {
            item.x1 += tx; item.x2 += tx; item.cx += tx;
            item.y1 += ty; item.y2 += ty; item.cy += ty;
            recalcLineBoundsAndCurve(item);
          } else if (item.type === 'bezier' && item.points) {
            item.points.forEach(p => {
              p.x += tx; p.y += ty;
              if (p.cp1) { p.cp1.x += tx; p.cp1.y += ty; }
              if (p.cp2) { p.cp2.x += tx; p.cp2.y += ty; }
            });
            recalcBezierBounds(item);
          }
        }
      }

      state.elements.set(item.id, item);
      renderSvgElement(item);
      importedCount++;
    });

    renderSelectionOverlay();
    updateInspector();
    saveHistoryState();
    return importedCount;
  }

  // =========================================================================
  // TOAST NOTIFICATIONS
  // =========================================================================

  let toastTimer = null;
  function showToast(msg) {
    if (toastTimer) clearTimeout(toastTimer);
    dom.toast.textContent = msg;
    dom.toast.classList.add('show');
    toastTimer = setTimeout(() => {
      dom.toast.classList.remove('show');
    }, 2800);
  }

  // =========================================================================
  // EVENT LISTENERS & WIRING
  // =========================================================================

  function setupEventListeners() {
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        setTool(btn.dataset.tool);
      });
    });

    dom.viewport.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    // Multi-touch gestures (Pinch-to-zoom and two-finger pan for mobile devices)
    dom.viewport.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        state.isMultiTouch = true;
        state.isDrawing = false;
        if (state.currentDrawingShape) {
          const el = document.getElementById(state.currentDrawingShape.id);
          if (el) el.remove();
          state.currentDrawingShape = null;
        }
        state.transforming = null;

        const t1 = e.touches[0];
        const t2 = e.touches[1];
        state.touchStartDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        state.touchStartZoom = state.zoom;
        state.touchStartMid = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
        state.touchStartPan = { x: state.pan.x, y: state.pan.y };
      }
    }, { passive: false });

    dom.viewport.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2 && state.isMultiTouch) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const currDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const currMid = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };

        const scale = currDist / (state.touchStartDist || 1);
        const newZoom = Math.max(0.15, Math.min(8, state.touchStartZoom * scale));

        const rect = dom.viewport.getBoundingClientRect();
        const startMidX = state.touchStartMid.x - rect.left;
        const startMidY = state.touchStartMid.y - rect.top;
        const dMidX = currMid.x - state.touchStartMid.x;
        const dMidY = currMid.y - state.touchStartMid.y;

        const svgX = (startMidX - state.touchStartPan.x) / state.touchStartZoom;
        const svgY = (startMidY - state.touchStartPan.y) / state.touchStartZoom;

        state.zoom = newZoom;
        state.pan.x = startMidX - svgX * newZoom + dMidX;
        state.pan.y = startMidY - svgY * newZoom + dMidY;

        applyTransform();
        updateZoomDisplay();
      }
    }, { passive: false });

    dom.viewport.addEventListener('touchend', (e) => {
      if (state.isMultiTouch && e.touches.length < 2) {
        state.isMultiTouch = false;
      }
    });

    dom.viewport.addEventListener('touchcancel', () => {
      state.isMultiTouch = false;
    });

    dom.viewport.addEventListener('dblclick', (e) => {
      if (state.tool === 'bezier' && state.bezierDraft) {
        e.preventDefault();
        e.stopPropagation();
        finishBezierDraft();
      }
    });

    dom.viewport.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
      const rect = dom.viewport.getBoundingClientRect();
      setZoom(state.zoom * zoomFactor, e.clientX - rect.left, e.clientY - rect.top);
    }, { passive: false });

    dom.btnZoomIn.addEventListener('click', () => setZoom(state.zoom * 1.25));
    dom.btnZoomOut.addEventListener('click', () => setZoom(state.zoom * 0.8));
    dom.btnZoomFit.addEventListener('click', zoomFit);
    dom.zoomValue.addEventListener('click', () => setZoom(1));

    // Document Dimensions Event Listeners (Topbar & Inspector)
    const handleTopDimChange = () => {
      setDocumentDimensions(dom.topDocW.value, dom.topDocH.value);
    };
    if (dom.topDocW) {
      dom.topDocW.addEventListener('change', handleTopDimChange);
      dom.topDocW.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleTopDimChange(); });
    }
    if (dom.topDocH) {
      dom.topDocH.addEventListener('change', handleTopDimChange);
      dom.topDocH.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleTopDimChange(); });
    }

    const handleSideDimChange = () => {
      setDocumentDimensions(dom.sideDocW.value, dom.sideDocH.value);
    };
    if (dom.sideDocW) {
      dom.sideDocW.addEventListener('change', handleSideDimChange);
      dom.sideDocW.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleSideDimChange(); });
    }
    if (dom.sideDocH) {
      dom.sideDocH.addEventListener('change', handleSideDimChange);
      dom.sideDocH.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleSideDimChange(); });
    }

    if (dom.docPresetSelect) {
      dom.docPresetSelect.addEventListener('change', (e) => {
        if (!e.target.value) return;
        const parts = e.target.value.split('x').map(Number);
        if (parts.length === 2 && parts[0] && parts[1]) {
          setDocumentDimensions(parts[0], parts[1]);
          zoomFit();
        }
      });
    }

    document.querySelectorAll('.doc-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const preset = btn.dataset.preset;
        if (preset) {
          const parts = preset.split('x').map(Number);
          if (parts.length === 2 && parts[0] && parts[1]) {
            setDocumentDimensions(parts[0], parts[1]);
            zoomFit();
          }
        }
      });
    });

    if (dom.btnDocFit) {
      dom.btnDocFit.addEventListener('click', zoomFit);
    }

    if (dom.canvasStatus) {
      dom.canvasStatus.style.cursor = 'pointer';
      dom.canvasStatus.title = 'Clique para alterar tamanho do documento';
      dom.canvasStatus.addEventListener('click', () => {
        if (dom.topDocW) {
          dom.topDocW.focus();
          dom.topDocW.select();
        }
      });
    }

    dom.btnToggleGrid.addEventListener('click', () => {
      state.gridVisible = !state.gridVisible;
      dom.canvasGrid.style.display = state.gridVisible ? 'block' : 'none';
      dom.btnToggleGrid.classList.toggle('active', state.gridVisible);
    });

    dom.btnToggleSnap.addEventListener('click', () => {
      state.snapToGrid = !state.snapToGrid;
      dom.btnToggleSnap.classList.toggle('active', state.snapToGrid);
      showToast(state.snapToGrid ? 'Snap à Grade ativado' : 'Snap à Grade desativado');
    });

    dom.btnUndo.addEventListener('click', undo);
    dom.btnRedo.addEventListener('click', redo);

    dom.btnClearCanvas.addEventListener('click', clearCanvas);
    dom.btnExportSvg.addEventListener('click', exportSVG);
    dom.btnExportSvgDirect.addEventListener('click', () => {
      dom.exportMenu.classList.remove('show');
      exportSVG();
    });
    dom.btnExportPng.addEventListener('click', () => {
      dom.exportMenu.classList.remove('show');
      exportPNG();
    });
    dom.btnSaveProject.addEventListener('click', () => {
      dom.exportMenu.classList.remove('show');
      saveProject();
    });

    dom.btnExportMore.addEventListener('click', (e) => {
      e.stopPropagation();
      dom.exportMenu.classList.toggle('show');
    });

    window.addEventListener('click', () => {
      dom.exportMenu.classList.remove('show');
    });

    dom.fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        openFile(e.target.files[0]);
      }
      dom.fileInput.value = '';
    });

    // Special Actions
    dom.btnConvertShape.addEventListener('click', convertSelectedShape);
    dom.btnToggleCurve.addEventListener('click', toggleLineCurvature);

    dom.curveAmountSlider.addEventListener('input', (e) => {
      setLineCurvatureAmount(parseInt(e.target.value, 10));
    });
    dom.curveAmountSlider.addEventListener('change', () => saveHistoryState());

    dom.btnCurveStraight.addEventListener('click', () => {
      setLineCurvatureAmount(0);
      saveHistoryState();
    });

    dom.btnCurveArch.addEventListener('click', () => {
      setLineCurvatureAmount(40);
      saveHistoryState();
    });

    dom.btnCurveInv.addEventListener('click', () => {
      setLineCurvatureAmount(-40);
      saveHistoryState();
    });

    // Conector Redondo de Ângulo Reto Controls
    dom.connectorRoundSlider.addEventListener('input', (e) => {
      setConnectorRadius(parseInt(e.target.value, 10));
    });
    dom.connectorRoundSlider.addEventListener('change', () => saveHistoryState());

    dom.btnElbow0.addEventListener('click', () => {
      setConnectorRadius(0);
      saveHistoryState();
    });

    dom.btnElbow16.addEventListener('click', () => {
      setConnectorRadius(16);
      saveHistoryState();
    });

    dom.btnElbow32.addEventListener('click', () => {
      setConnectorRadius(32);
      saveHistoryState();
    });

    dom.btnToggleElbowDir.addEventListener('click', toggleElbowDirection);

    // Bézier Path Controls & Node Manipulation
    dom.btnToggleBezierClosed.addEventListener('click', toggleBezierClosed);
    if (dom.btnBezierCurveNode) dom.btnBezierCurveNode.addEventListener('click', curveSelectedNode);
    if (dom.btnBezierStraightenNode) dom.btnBezierStraightenNode.addEventListener('click', straightenSelectedNode);
    if (dom.btnBezierSmoothNode) dom.btnBezierSmoothNode.addEventListener('click', toggleSmoothSelectedNode);
    if (dom.btnBezierDeleteNode) dom.btnBezierDeleteNode.addEventListener('click', deleteSelectedNode);

    // Corner Radius
    dom.cornerRadiusSlider.addEventListener('input', (e) => {
      setCornerRadius(parseInt(e.target.value, 10));
    });
    dom.cornerRadiusSlider.addEventListener('change', () => saveHistoryState());

    dom.btnCorner0.addEventListener('click', () => {
      setCornerRadius(0);
      saveHistoryState();
    });

    dom.btnCorner12.addEventListener('click', () => {
      setCornerRadius(12);
      saveHistoryState();
    });

    dom.btnCornerMax.addEventListener('click', () => {
      const item = getSelectedElement();
      if (item && item.type === 'rect') {
        setCornerRadius(Math.min(item.width, item.height) / 2);
        saveHistoryState();
      }
    });

    // Polygon Points
    dom.polyPointsSlider.addEventListener('input', (e) => {
      setPolygonPoints(parseInt(e.target.value, 10));
    });
    dom.polyPointsSlider.addEventListener('change', () => saveHistoryState());

    dom.btnPolyDec.addEventListener('click', () => {
      const item = getSelectedElement();
      if (item && item.type === 'polygon') {
        setPolygonPoints((item.polyPoints || 5) - 1);
        saveHistoryState();
      }
    });

    dom.btnPolyInc.addEventListener('click', () => {
      const item = getSelectedElement();
      if (item && item.type === 'polygon') {
        setPolygonPoints((item.polyPoints || 5) + 1);
        saveHistoryState();
      }
    });

    // Dimensions
    dom.propX.addEventListener('change', (e) => {
      const item = getSelectedElement();
      if (item) {
        item.x = parseFloat(e.target.value) || 0;
        renderSvgElement(item);
        renderSelectionOverlay();
        saveHistoryState();
      }
    });

    dom.propY.addEventListener('change', (e) => {
      const item = getSelectedElement();
      if (item) {
        item.y = parseFloat(e.target.value) || 0;
        renderSvgElement(item);
        renderSelectionOverlay();
        saveHistoryState();
      }
    });

    dom.propW.addEventListener('change', (e) => {
      const item = getSelectedElement();
      if (item) {
        const oldW = item.width || 1;
        const newW = Math.max(1, parseFloat(e.target.value) || 1);
        if (state.lockAspectRatio && oldW > 0) {
          scaleSelectedObject(newW / oldW, false);
        } else {
          item.width = newW;
          renderSvgElement(item);
          renderSelectionOverlay();
          updateInspector();
          saveHistoryState();
        }
      }
    });

    dom.propH.addEventListener('change', (e) => {
      const item = getSelectedElement();
      if (item) {
        const oldH = item.height || 1;
        const newH = Math.max(1, parseFloat(e.target.value) || 1);
        if (state.lockAspectRatio && oldH > 0) {
          scaleSelectedObject(newH / oldH, false);
        } else {
          item.height = newH;
          renderSvgElement(item);
          renderSelectionOverlay();
          updateInspector();
          saveHistoryState();
        }
      }
    });

    dom.propRotation.addEventListener('input', (e) => {
      const item = getSelectedElement();
      if (item) {
        item.rotation = parseInt(e.target.value, 10) || 0;
        dom.propRotationVal.textContent = `${item.rotation}°`;
        renderSvgElement(item);
        renderSelectionOverlay();
      }
    });
    dom.propRotation.addEventListener('change', () => saveHistoryState());

    // Flip & Invert Buttons
    if (dom.btnFlipH) {
      dom.btnFlipH.addEventListener('click', () => flipSelectedObject('horizontal'));
    }
    if (dom.btnFlipV) {
      dom.btnFlipV.addEventListener('click', () => flipSelectedObject('vertical'));
    }

    // Aspect Ratio Lock Toggle
    if (dom.btnLockAspect) {
      dom.btnLockAspect.addEventListener('click', () => {
        state.lockAspectRatio = !state.lockAspectRatio;
        updateInspector();
        showToast(state.lockAspectRatio ? 'Proporção bloqueada' : 'Proporção livre');
      });
    }

    // Scale / Resize Buttons
    if (dom.btnScaleHalf) {
      dom.btnScaleHalf.addEventListener('click', () => scaleSelectedObject(0.5));
    }
    if (dom.btnScaleMinus) {
      dom.btnScaleMinus.addEventListener('click', () => scaleSelectedObject(0.9));
    }
    if (dom.btnScalePlus) {
      dom.btnScalePlus.addEventListener('click', () => scaleSelectedObject(1.1));
    }
    if (dom.btnScaleDouble) {
      dom.btnScaleDouble.addEventListener('click', () => scaleSelectedObject(2.0));
    }
    if (dom.btnScaleApply) {
      dom.btnScaleApply.addEventListener('click', () => {
        const pct = parseFloat(dom.propScaleInput.value);
        if (pct > 0) scaleSelectedObject(pct / 100);
      });
    }
    if (dom.propScaleInput) {
      dom.propScaleInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const pct = parseFloat(dom.propScaleInput.value);
          if (pct > 0) scaleSelectedObject(pct / 100);
        }
      });
    }

    // Fill Mode
    dom.fillModeSolid.addEventListener('click', () => {
      const item = getSelectedElement();
      if (item) {
        if (item.type === 'bezier') item.closed = true;
        item.fillType = 'solid';
        renderSvgElement(item);
        renderSelectionOverlay();
        updateInspector();
        saveHistoryState();
      }
    });

    dom.fillModeGradient.addEventListener('click', () => {
      const item = getSelectedElement();
      if (item) {
        if (item.type === 'bezier') item.closed = true;
        item.fillType = 'gradient';
        renderSvgElement(item);
        renderSelectionOverlay();
        updateInspector();
        saveHistoryState();
      }
    });

    dom.fillModeNone.addEventListener('click', () => {
      const item = getSelectedElement();
      if (item) {
        item.fillType = 'none';
        renderSvgElement(item);
        renderSelectionOverlay();
        updateInspector();
        saveHistoryState();
      }
    });

    dom.propFillColor.addEventListener('input', (e) => {
      const item = getSelectedElement();
      if (item) {
        if (item.type === 'bezier') item.closed = true;
        item.fillType = 'solid';
        item.fillColor = e.target.value;
        dom.propFillColorHex.value = e.target.value;
        renderSvgElement(item);
      }
    });
    dom.propFillColor.addEventListener('change', () => {
      renderSelectionOverlay();
      updateInspector();
      saveHistoryState();
    });

    dom.propFillColorHex.addEventListener('change', (e) => {
      const item = getSelectedElement();
      if (item) {
        if (item.type === 'bezier') item.closed = true;
        item.fillType = 'solid';
        item.fillColor = e.target.value;
        dom.propFillColor.value = e.target.value;
        renderSvgElement(item);
        renderSelectionOverlay();
        updateInspector();
        saveHistoryState();
      }
    });

    dom.propFillOpacity.addEventListener('input', (e) => {
      const item = getSelectedElement();
      if (item) {
        item.fillOpacity = Math.max(0, Math.min(100, parseInt(e.target.value, 10))) / 100;
        renderSvgElement(item);
      }
    });
    dom.propFillOpacity.addEventListener('change', () => saveHistoryState());

    // Gradient
    document.querySelectorAll('input[name="gradient-type"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        const item = getSelectedElement();
        if (item && item.gradient) {
          item.gradient.type = e.target.value;
          dom.gradAngleWrapper.style.display = item.gradient.type === 'linear' ? 'block' : 'none';
          renderSvgElement(item);
          updateGradientPreview(item.gradient);
          saveHistoryState();
        }
      });
    });

    dom.gradStop1Color.addEventListener('input', (e) => {
      const item = getSelectedElement();
      if (item && item.gradient) {
        item.gradient.stop1 = e.target.value;
        dom.gradStop1Hex.textContent = e.target.value;
        renderSvgElement(item);
        updateGradientPreview(item.gradient);
      }
    });
    dom.gradStop1Color.addEventListener('change', () => saveHistoryState());

    dom.gradStop2Color.addEventListener('input', (e) => {
      const item = getSelectedElement();
      if (item && item.gradient) {
        item.gradient.stop2 = e.target.value;
        dom.gradStop2Hex.textContent = e.target.value;
        renderSvgElement(item);
        updateGradientPreview(item.gradient);
      }
    });
    dom.gradStop2Color.addEventListener('change', () => saveHistoryState());

    dom.gradAngleSlider.addEventListener('input', (e) => {
      const item = getSelectedElement();
      if (item && item.gradient) {
        item.gradient.angle = parseInt(e.target.value, 10);
        dom.gradAngleVal.textContent = `${item.gradient.angle}°`;
        renderSvgElement(item);
        updateGradientPreview(item.gradient);
      }
    });
    dom.gradAngleSlider.addEventListener('change', () => saveHistoryState());

    // Stroke
    dom.btnToggleStroke.addEventListener('click', () => {
      const item = getSelectedElement();
      if (item) {
        item.hasStroke = !item.hasStroke;
        renderSvgElement(item);
        updateInspector();
        saveHistoryState();
      }
    });

    dom.propStrokeColor.addEventListener('input', (e) => {
      const item = getSelectedElement();
      if (item) {
        item.hasStroke = true;
        item.strokeColor = e.target.value;
        dom.propStrokeColorHex.value = e.target.value;
        renderSvgElement(item);
      }
    });
    dom.propStrokeColor.addEventListener('change', () => saveHistoryState());

    dom.propStrokeColorHex.addEventListener('change', (e) => {
      const item = getSelectedElement();
      if (item) {
        item.hasStroke = true;
        item.strokeColor = e.target.value;
        dom.propStrokeColor.value = e.target.value;
        renderSvgElement(item);
        saveHistoryState();
      }
    });

    dom.propStrokeWidth.addEventListener('input', (e) => {
      const item = getSelectedElement();
      if (item) {
        item.strokeWidth = Math.max(0, parseInt(e.target.value, 10));
        item.hasStroke = item.strokeWidth > 0;
        renderSvgElement(item);
      }
    });
    dom.propStrokeWidth.addEventListener('change', () => saveHistoryState());

    dom.propStrokeDash.addEventListener('change', (e) => {
      const item = getSelectedElement();
      if (item) {
        item.strokeDash = e.target.value;
        renderSvgElement(item);
        saveHistoryState();
      }
    });

    dom.propStrokeCap.addEventListener('change', (e) => {
      const item = getSelectedElement();
      if (item) {
        item.strokeCap = e.target.value;
        renderSvgElement(item);
        saveHistoryState();
      }
    });

    // Arrange
    dom.btnBringFront.addEventListener('click', bringToFront);
    dom.btnSendBack.addEventListener('click', sendToBack);
    dom.btnDuplicate.addEventListener('click', duplicateSelected);
    dom.btnDelete.addEventListener('click', deleteSelected);

    // Text Tool Properties Listeners
    if (dom.propTextContent) {
      dom.propTextContent.addEventListener('input', (e) => {
        const item = getSelectedElement();
        if (item && item.type === 'text') {
          item.text = e.target.value;
          renderSvgElement(item);
          renderSelectionOverlay();
        }
      });
      dom.propTextContent.addEventListener('change', () => saveHistoryState());
    }

    if (dom.propFontFamily) {
      dom.propFontFamily.addEventListener('change', (e) => {
        const item = getSelectedElement();
        if (item && item.type === 'text') {
          item.fontFamily = e.target.value;
          renderSvgElement(item);
          renderSelectionOverlay();
          saveHistoryState();
        }
      });
    }

    const setItemFontSize = (size) => {
      const item = getSelectedElement();
      if (item && item.type === 'text') {
        const s = Math.max(8, Math.min(500, parseInt(size, 10) || 48));
        item.fontSize = s;
        if (dom.propFontSizeInput) dom.propFontSizeInput.value = s;
        if (dom.propFontSizeSlider) dom.propFontSizeSlider.value = Math.min(180, s);
        renderSvgElement(item);
        renderSelectionOverlay();
        saveHistoryState();
      }
    };

    if (dom.propFontSizeSlider) {
      dom.propFontSizeSlider.addEventListener('input', (e) => setItemFontSize(e.target.value));
    }
    if (dom.propFontSizeInput) {
      dom.propFontSizeInput.addEventListener('change', (e) => setItemFontSize(e.target.value));
      dom.propFontSizeInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') setItemFontSize(e.target.value); });
    }

    if (dom.btnFont24) dom.btnFont24.addEventListener('click', () => setItemFontSize(24));
    if (dom.btnFont48) dom.btnFont48.addEventListener('click', () => setItemFontSize(48));
    if (dom.btnFont72) dom.btnFont72.addEventListener('click', () => setItemFontSize(72));
    if (dom.btnFont96) dom.btnFont96.addEventListener('click', () => setItemFontSize(96));

    if (dom.btnTextBold) {
      dom.btnTextBold.addEventListener('click', () => {
        const item = getSelectedElement();
        if (item && item.type === 'text') {
          item.fontWeight = (item.fontWeight === 'bold' || item.fontWeight >= 700) ? 'normal' : 'bold';
          dom.btnTextBold.classList.toggle('active', item.fontWeight === 'bold');
          renderSvgElement(item);
          renderSelectionOverlay();
          saveHistoryState();
        }
      });
    }

    if (dom.btnTextItalic) {
      dom.btnTextItalic.addEventListener('click', () => {
        const item = getSelectedElement();
        if (item && item.type === 'text') {
          item.fontStyle = item.fontStyle === 'italic' ? 'normal' : 'italic';
          dom.btnTextItalic.classList.toggle('active', item.fontStyle === 'italic');
          renderSvgElement(item);
          renderSelectionOverlay();
          saveHistoryState();
        }
      });
    }

    const setTextAlign = (align) => {
      const item = getSelectedElement();
      if (item && item.type === 'text') {
        item.textAlign = align;
        if (dom.btnAlignLeft) dom.btnAlignLeft.classList.toggle('active', align === 'left');
        if (dom.btnAlignCenter) dom.btnAlignCenter.classList.toggle('active', align === 'center');
        if (dom.btnAlignRight) dom.btnAlignRight.classList.toggle('active', align === 'right');
        renderSvgElement(item);
        renderSelectionOverlay();
        saveHistoryState();
      }
    };

    if (dom.btnAlignLeft) dom.btnAlignLeft.addEventListener('click', () => setTextAlign('left'));
    if (dom.btnAlignCenter) dom.btnAlignCenter.addEventListener('click', () => setTextAlign('center'));
    if (dom.btnAlignRight) dom.btnAlignRight.addEventListener('click', () => setTextAlign('right'));

    // Mobile Inspector Drawer Functions
    function openMobileInspector() {
      if (dom.inspectorPanel) dom.inspectorPanel.classList.add('mobile-open');
    }
    function closeMobileInspector() {
      if (dom.inspectorPanel) dom.inspectorPanel.classList.remove('mobile-open');
    }
    function toggleMobileInspector() {
      if (dom.inspectorPanel) dom.inspectorPanel.classList.toggle('mobile-open');
    }

    if (dom.btnMobileInspector) dom.btnMobileInspector.addEventListener('click', toggleMobileInspector);
    if (dom.btnMobileInspectorToggle) dom.btnMobileInspectorToggle.addEventListener('click', toggleMobileInspector);
    if (dom.btnCloseInspector) dom.btnCloseInspector.addEventListener('click', closeMobileInspector);

    // Mobile Menu Sheet Functions
    function openMobileMenu() {
      if (dom.mobileMenuSheet) {
        if (dom.mobileDocTitle) dom.mobileDocTitle.value = dom.docTitle.value;
        if (dom.mobileDocW) dom.mobileDocW.value = state.docWidth;
        if (dom.mobileDocH) dom.mobileDocH.value = state.docHeight;
        dom.mobileMenuSheet.classList.add('open');
      }
    }
    function closeMobileMenu() {
      if (dom.mobileMenuSheet) dom.mobileMenuSheet.classList.remove('open');
    }

    if (dom.btnMobileMenuToggle) dom.btnMobileMenuToggle.addEventListener('click', openMobileMenu);
    if (dom.btnCloseMobileMenu) dom.btnCloseMobileMenu.addEventListener('click', closeMobileMenu);
    if (dom.mobileSheetBackdrop) dom.mobileSheetBackdrop.addEventListener('click', closeMobileMenu);

    if (dom.mobileDocTitle) {
      dom.mobileDocTitle.addEventListener('input', (e) => { dom.docTitle.value = e.target.value; });
    }
    if (dom.mobileDocW) {
      dom.mobileDocW.addEventListener('change', (e) => {
        setDocumentDimensions(e.target.value, dom.mobileDocH ? dom.mobileDocH.value : 800);
      });
    }
    if (dom.mobileDocH) {
      dom.mobileDocH.addEventListener('change', (e) => {
        setDocumentDimensions(dom.mobileDocW ? dom.mobileDocW.value : 1200, e.target.value);
      });
    }

    if (dom.btnMobileExportSvg) {
      dom.btnMobileExportSvg.addEventListener('click', () => {
        closeMobileMenu();
        exportSVG();
      });
    }
    if (dom.btnMobileExportPng) {
      dom.btnMobileExportPng.addEventListener('click', () => {
        closeMobileMenu();
        exportPNG();
      });
    }
    if (dom.btnMobileSaveJson) {
      dom.btnMobileSaveJson.addEventListener('click', () => {
        closeMobileMenu();
        saveProject();
      });
    }
    if (dom.mobileFileInput) {
      dom.mobileFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          closeMobileMenu();
          openFile(e.target.files[0]);
        }
      });
    }
    if (dom.btnMobileClear) {
      dom.btnMobileClear.addEventListener('click', () => {
        closeMobileMenu();
        clearCanvas();
      });
    }

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (['input', 'textarea', 'select'].includes(document.activeElement.tagName.toLowerCase())) {
        return;
      }

      if (e.code === 'Space' && !state.spacePressed) {
        state.spacePressed = true;
        dom.viewport.classList.add('panning');
      }

      // Bézier finish / cancel keys
      if (state.tool === 'bezier' && state.bezierDraft) {
        if (e.key === 'Enter') {
          e.preventDefault();
          finishBezierDraft();
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          cancelBezierDraft();
          return;
        }
      }

      // Hotkeys for Tools (CorelDRAW Style)
      if (e.key === 'v' || e.key === 'V') setTool('select');
      if (e.key === 't' || e.key === 'T') setTool('text');
      if (e.key === 'b' || e.key === 'B') setTool('bezier');
      if (e.key === 'x' || e.key === 'X') setTool('connector-round');
      if (e.key === 'l' || e.key === 'L') setTool('line');
      if (e.key === 'r' || e.key === 'R') setTool('rect');
      if (e.key === 'c' || e.key === 'C') setTool('circle');
      if (e.key === 'p' || e.key === 'P') setTool('polygon');
      if (e.key === 'h' || e.key === 'H') setTool('pan');

      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelected();
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        redo();
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        duplicateSelected();
      }

      const item = getSelectedElement();
      if (item && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        if (e.key === 'ArrowUp') { 
          item.y -= step; 
          if (item.y1 !== undefined) item.y1 -= step; 
          if (item.y2 !== undefined) item.y2 -= step;
          if (item.cy !== undefined) item.cy -= step;
          if (item.points) item.points.forEach(p => { p.y -= step; if (p.cp1) p.cp1.y -= step; if (p.cp2) p.cp2.y -= step; });
        }
        if (e.key === 'ArrowDown') { 
          item.y += step; 
          if (item.y1 !== undefined) item.y1 += step; 
          if (item.y2 !== undefined) item.y2 += step;
          if (item.cy !== undefined) item.cy += step;
          if (item.points) item.points.forEach(p => { p.y += step; if (p.cp1) p.cp1.y += step; if (p.cp2) p.cp2.y += step; });
        }
        if (e.key === 'ArrowLeft') { 
          item.x -= step; 
          if (item.x1 !== undefined) item.x1 -= step; 
          if (item.x2 !== undefined) item.x2 -= step;
          if (item.cx !== undefined) item.cx -= step;
          if (item.points) item.points.forEach(p => { p.x -= step; if (p.cp1) p.cp1.x -= step; if (p.cp2) p.cp2.x -= step; });
        }
        if (e.key === 'ArrowRight') { 
          item.x += step; 
          if (item.x1 !== undefined) item.x1 += step; 
          if (item.x2 !== undefined) item.x2 += step;
          if (item.cx !== undefined) item.cx += step;
          if (item.points) item.points.forEach(p => { p.x += step; if (p.cp1) p.cp1.x += step; if (p.cp2) p.cp2.x += step; });
        }
        renderSvgElement(item);
        renderSelectionOverlay();
        updateInspector();
        saveHistoryState();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        state.spacePressed = false;
        if (state.tool !== 'pan') {
          dom.viewport.classList.remove('panning');
        }
      }
    });
  }

  function updateUI() {
    updateUndoRedoButtons();
    updateInspector();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
