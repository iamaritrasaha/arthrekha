import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { Link } from 'react-router-dom';
import ArthrekhaMark from '@/components/brand/ArthrekhaMark';
import { getBudgetEstimate } from '@/data/selectors';
import styles from './LandingPage.module.css';
import { useTranslation } from '@/i18n';

const CHAPTERS = [
  {
    image: 'assets/fiscal-horizon.webp',
    eyebrow: 'FY 2026–27 · Union Government',
    title: 'PUBLIC MONEY',
    emphasis: 'IN MOTION.',
    body: 'A living view of India’s public finances—from the national plan to the first recorded quarter.',
    action: 'Enter the budget story',
    href: '/',
    alignment: 'left',
  },
  {
    image: 'assets/public-investment.webp',
    eyebrow: '01 · From plan to public life',
    title: 'WHERE',
    emphasis: 'SPENDING LANDS.',
    body: 'Trace expenditure into infrastructure and public systems, while keeping annual plans distinct from provisional actuals.',
    action: 'Explore the numbers',
    href: '/explore',
    alignment: 'right',
  },
  {
    image: 'assets/economic-ecosystem.webp',
    eyebrow: '02 · Evidence behind every figure',
    title: 'FOLLOW',
    emphasis: 'THE RUPEE.',
    body: 'Read receipts, spending and the fiscal gap as one connected system—with the source attached to every observation.',
    action: 'See sources & method',
    href: '/sources',
    alignment: 'left',
  },
] as const;

const SCENE_INTERVAL = 4200;
const TRANSITION_DURATION = 1150;

export default function LandingPage() {
  const { t } = useTranslation();
  const [scene, setScene] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [instantReset, setInstantReset] = useState(false);
  const total = getBudgetEstimate('total_expenditure');
  const totalLakhCrore = total ? (total.amount / 100000).toFixed(1) : '—';

  const moveTo = useCallback((index: number) => {
    setInstantReset(false);
    setScene(index);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    if (scene === CHAPTERS.length) {
      const reset = window.setTimeout(() => {
        setInstantReset(true);
        setScene(0);
        requestAnimationFrame(() => requestAnimationFrame(() => setInstantReset(false)));
      }, TRANSITION_DURATION);
      return () => window.clearTimeout(reset);
    }
    const advance = window.setTimeout(() => moveTo(scene + 1), SCENE_INTERVAL);
    return () => window.clearTimeout(advance);
  }, [isPaused, moveTo, scene]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown' || event.key === 'PageDown') moveTo(Math.min((scene % CHAPTERS.length) + 1, CHAPTERS.length - 1));
      if (event.key === 'ArrowUp' || event.key === 'PageUp') moveTo(Math.max((scene % CHAPTERS.length) - 1, 0));
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [moveTo, scene]);

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'touch') return;
    const x = (event.clientX / window.innerWidth - .5) * 2;
    const y = (event.clientY / window.innerHeight - .5) * 2;
    event.currentTarget.style.setProperty('--pointer-x', `${x * -12}px`);
    event.currentTarget.style.setProperty('--pointer-y', `${y * -8}px`);
  };

  const activeScene = scene % CHAPTERS.length;
  const trackStyle = { '--scene': scene } as CSSProperties;

  return (
    <main id="main" className={`${styles.page} ${isPaused ? styles.paused : ''}`} onPointerMove={handlePointerMove}>
      <a className={styles.skipLink} href="#landing-navigation">{t('Skip animated scenes')}</a>

      <header className={styles.header}>
        <Link to="/" className={styles.brand} aria-label={t('Arthrekha home')}>
          <ArthrekhaMark size={27} />
          <span>ARTHREKHA</span>
        </Link>
        <nav id="landing-navigation" className={styles.navigation} aria-label={t('Main navigation')}>
          <Link to="/explore">{t('Explore')}</Link>
          <Link to="/learn">{t('Learn')}</Link>
          <Link to="/sources">{t('Sources')}</Link>
          <Link className={styles.enterLink} to="/">{t('Budget story')} <span aria-hidden="true">↗</span></Link>
        </nav>
      </header>

      <div className={`${styles.track} ${instantReset ? styles.instant : ''}`} style={trackStyle}>
        {CHAPTERS.map((chapter, index) => (
          <Chapter key={chapter.image} chapter={chapter} active={activeScene === index && scene !== CHAPTERS.length} index={index} total={totalLakhCrore} paused={isPaused} />
        ))}
        <Chapter chapter={CHAPTERS[0]} active={scene === CHAPTERS.length} index={0} total={totalLakhCrore} paused={isPaused} duplicate />
      </div>

      <EconomicFlowCanvas paused={isPaused} activeScene={activeScene} />

      <div className={styles.sceneControls}>
        <div className={styles.sceneDots} aria-label={t('Choose animated scene')}>
          {CHAPTERS.map((_, index) => (
            <button key={index} type="button" className={activeScene === index ? styles.activeDot : ''} onClick={() => moveTo(index)} aria-label={`${t('Show scene')} ${index + 1}`} aria-current={activeScene === index ? 'step' : undefined}>
              <span>{String(index + 1).padStart(2, '0')}</span><i />
            </button>
          ))}
        </div>
        <button className={styles.motionToggle} type="button" onClick={() => setIsPaused(value => !value)} aria-pressed={isPaused}>
          <span aria-hidden="true">{isPaused ? '▶' : 'Ⅱ'}</span>{t(isPaused ? 'Play' : 'Pause')}
        </button>
      </div>
    </main>
  );
}

type ChapterData = typeof CHAPTERS[number];

function Chapter({ chapter, active, index, total, paused, duplicate = false }: { chapter: ChapterData; active: boolean; index: number; total: string; paused: boolean; duplicate?: boolean }) {
  const { t, localizeFormattedValue } = useTranslation();
  return (
    <section className={`${styles.chapter} ${styles[chapter.alignment]} ${active ? styles.active : ''}`} aria-hidden={!active || duplicate}>
      <div className={styles.artLayer}>
        <img src={`${import.meta.env.BASE_URL}${chapter.image}`} alt="" />
        <LivingArtwork image={`${import.meta.env.BASE_URL}${chapter.image}`} active={active} paused={paused} scene={index} />
      </div>
      <div className={styles.depthLayer} aria-hidden="true" />
      <article className={styles.copy}>
        <p className={styles.eyebrow}><span />{t(chapter.eyebrow)}</p>
        {index === 0 && <p className={styles.fiscalNote}>₹{localizeFormattedValue(total)} {t('lakh crore planned expenditure')}</p>}
        <h1>{t(chapter.title)}<br /><em>{t(chapter.emphasis)}</em></h1>
        <p className={styles.body}>{t(chapter.body)}</p>
        <Link className={styles.chapterLink} to={chapter.href} tabIndex={active && !duplicate ? 0 : -1}>{t(chapter.action)}<span aria-hidden="true">→</span></Link>
      </article>
      <p className={styles.chapterIndex} aria-hidden="true">0{index + 1}<span>/ 03</span></p>
    </section>
  );
}

const VERTEX_SHADER = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision mediump float;
  uniform sampler2D u_texture;
  uniform float u_time;
  uniform float u_scene;
  uniform vec2 u_resolution;
  uniform vec2 u_image_resolution;
  varying vec2 v_uv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }

  vec2 coverUv(vec2 uv) {
    float screen_aspect = u_resolution.x / u_resolution.y;
    float image_aspect = u_image_resolution.x / u_image_resolution.y;
    vec2 centered = uv - 0.5;
    if (screen_aspect > image_aspect) centered.y *= image_aspect / screen_aspect;
    else centered.x *= screen_aspect / image_aspect;
    return centered + 0.5;
  }

  void main() {
    vec2 uv = coverUv(v_uv);
    vec4 base = texture2D(u_texture, uv);
    float gold = smoothstep(0.08, 0.42, base.r - base.b) * smoothstep(0.34, 0.78, base.r);
    float teal = smoothstep(0.04, 0.26, base.g - base.r) * smoothstep(0.22, 0.62, base.g);
    float lower = 1.0 - smoothstep(0.15, 0.54, v_uv.y);
    float sky = smoothstep(0.5, 0.96, v_uv.y);
    float luminance = dot(base.rgb, vec3(0.299, 0.587, 0.114));
    float vegetation = lower * (1.0 - smoothstep(0.16, 0.43, luminance));

    float wind = sin(u_time * 1.45 + uv.y * 31.0 + noise(uv * 9.0) * 4.0);
    float grass_motion = wind * 0.0072 * vegetation;
    vec2 living_uv = uv + vec2(grass_motion, 0.0);

    float cloud_noise = noise(vec2(uv.x * 5.0 - u_time * 0.055, uv.y * 7.0));
    living_uv.x += (cloud_noise - 0.5) * 0.0062 * sky;

    float flow_wave = sin(uv.y * 88.0 - u_time * 7.0) + sin(uv.x * 62.0 + uv.y * 31.0 - u_time * 4.2);
    float flow_mask = clamp(gold * 0.9 + teal * step(1.5, u_scene), 0.0, 1.0);
    living_uv.x += flow_wave * 0.0055 * flow_mask;
    living_uv.y += sin(uv.x * 74.0 - u_time * 5.4) * 0.0032 * flow_mask;

    vec4 color = texture2D(u_texture, living_uv);
    float travelling_light = pow(max(0.0, sin((uv.x * 0.7 + uv.y) * 72.0 - u_time * 8.0)), 18.0);
    float fine_current = pow(max(0.0, sin(uv.y * 145.0 - u_time * 11.0)), 26.0);
    color.rgb += vec3(1.0, 0.58, 0.18) * travelling_light * gold * 0.48;
    color.rgb += vec3(0.2, 0.9, 0.86) * fine_current * teal * 0.36;

    float breeze_glint = noise(vec2(uv.x * 42.0 + u_time * 0.9, uv.y * 34.0 - u_time * 0.5));
    color.rgb += vec3(0.08, 0.12, 0.14) * breeze_glint * lower * 0.28;
    gl_FragColor = color;
  }
`;

function LivingArtwork({ image, active, paused, scene }: { image: string; active: boolean; paused: boolean; scene: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  const pausedRef = useRef(paused);
  useEffect(() => { activeRef.current = active; }, [active]);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'high-performance' });
    if (!canvas || !gl) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const program = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
    if (!program) return;
    const position = gl.getAttribLocation(program, 'a_position');
    const timeUniform = gl.getUniformLocation(program, 'u_time');
    const sceneUniform = gl.getUniformLocation(program, 'u_scene');
    const resolutionUniform = gl.getUniformLocation(program, 'u_resolution');
    const imageResolutionUniform = gl.getUniformLocation(program, 'u_image_resolution');
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.useProgram(program);
    gl.uniform1i(gl.getUniformLocation(program, 'u_texture'), 0);
    gl.uniform1f(sceneUniform, scene);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

    const source = new Image();
    let frame = 0;
    let last = performance.now();
    let clock = 0;
    let ready = false;

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.max(1, Math.round(canvas.clientWidth * ratio));
      const height = Math.max(1, Math.round(canvas.clientHeight * ratio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
      gl.uniform2f(resolutionUniform, width, height);
    };

    const draw = (now: number) => {
      const delta = Math.min((now - last) / 1000, .05);
      last = now;
      if (activeRef.current && !pausedRef.current && !reduced) clock += delta;
      if (ready && (activeRef.current || reduced)) {
        resize();
        gl.uniform1f(timeUniform, clock);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
      frame = requestAnimationFrame(draw);
    };

    source.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      gl.uniform2f(imageResolutionUniform, source.naturalWidth, source.naturalHeight);
      ready = true;
      canvas.dataset.ready = 'true';
    };
    source.src = image;
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }, [image, scene]);

  return <canvas ref={canvasRef} className={styles.livingArtwork} aria-hidden="true" />;
}

function createProgram(gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string) {
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { gl.deleteShader(shader); return null; }
    return shader;
  };
  const vertex = compile(gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertex || !fragment) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { gl.deleteProgram(program); return null; }
  return program;
}

function EconomicFlowCanvas({ paused, activeScene }: { paused: boolean; activeScene: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  const sceneRef = useRef(activeScene);
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => { sceneRef.current = activeScene; }, [activeScene]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width = 0;
    let height = 0;
    let frame = 0;
    let previous = performance.now();
    const motes = Array.from({ length: 42 }, (_, index) => ({
      progress: (index / 42 + Math.random() * .04) % 1,
      speed: .025 + Math.random() * .035,
      size: .7 + Math.random() * 1.7,
      offset: (Math.random() - .5) * .16,
      teal: index % 5 === 0,
    }));

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = (now: number) => {
      const delta = Math.min((now - previous) / 1000, .05);
      previous = now;
      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = 'lighter';
      motes.forEach(mote => {
        if (!pausedRef.current && !reduced) mote.progress = (mote.progress + mote.speed * delta) % 1;
        const direction = sceneRef.current === 1 ? -1 : 1;
        const progress = direction === 1 ? mote.progress : 1 - mote.progress;
        const y = height * (1.08 - progress * 1.2);
        const base = sceneRef.current === 1 ? .34 : sceneRef.current === 2 ? .66 : .7;
        const x = width * (base + mote.offset + Math.sin(progress * 8 + mote.offset * 10) * .055);
        const color = mote.teal ? '75, 229, 215' : '255, 187, 78';
        context.beginPath();
        context.moveTo(x, y + 16);
        context.lineTo(x, y);
        context.strokeStyle = `rgba(${color}, .4)`;
        context.lineWidth = mote.size;
        context.stroke();
        context.beginPath();
        context.arc(x, y, mote.size * 1.2, 0, Math.PI * 2);
        context.fillStyle = `rgba(${color}, .82)`;
        context.shadowColor = `rgba(${color}, .8)`;
        context.shadowBlur = 8;
        context.fill();
        context.shadowBlur = 0;
      });
      context.globalCompositeOperation = 'source-over';
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas className={styles.flowCanvas} ref={canvasRef} aria-hidden="true" />;
}
