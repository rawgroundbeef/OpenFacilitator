import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
  Sequence,
  Easing,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/PressStart2P";

const { fontFamily } = loadFont();

// Pixel art colors
const COLORS = {
  bg: "#1a1a2e",
  ground: "#16213e",
  groundLight: "#1f4068",
  character: "#e94560",
  characterDark: "#c73e54",
  coin: "#ffd700",
  coinDark: "#daa520",
  shield: "#00ff88",
  shieldGlow: "#00ff8844",
  text: "#ffffff",
  textMuted: "#888888",
  danger: "#ff4444",
  success: "#00ff88",
};

// Pixel-style font
const pixelFont = {
  fontFamily,
  imageRendering: "pixelated" as const,
};

// Simple pixel character (running business)
const PixelCharacter = ({
  x,
  y,
  frame,
  isWobbling = false,
  isJumping = false,
}: {
  x: number;
  y: number;
  frame: number;
  isWobbling?: boolean;
  isJumping?: boolean;
}) => {
  // Running animation - legs alternate
  const runCycle = Math.floor(frame / 4) % 4;
  const legOffset = runCycle === 1 || runCycle === 3 ? 4 : 0;
  const armOffset = runCycle === 0 || runCycle === 2 ? 3 : -3;

  // Wobble effect
  const wobbleX = isWobbling ? Math.sin(frame * 0.5) * 8 : 0;
  const wobbleRotate = isWobbling ? Math.sin(frame * 0.3) * 15 : 0;

  // Jump offset
  const jumpY = isJumping ? -30 : 0;

  return (
    <div
      style={{
        position: "absolute",
        left: x + wobbleX,
        top: y + jumpY,
        transform: `rotate(${wobbleRotate}deg)`,
        transition: "none",
      }}
    >
      {/* Body */}
      <div
        style={{
          width: 40,
          height: 50,
          backgroundColor: COLORS.character,
          borderRadius: 8,
          position: "relative",
        }}
      >
        {/* Head */}
        <div
          style={{
            width: 36,
            height: 36,
            backgroundColor: COLORS.character,
            borderRadius: "50%",
            position: "absolute",
            top: -30,
            left: 2,
          }}
        >
          {/* Eyes */}
          <div
            style={{
              width: 8,
              height: 8,
              backgroundColor: "#fff",
              borderRadius: "50%",
              position: "absolute",
              top: 10,
              left: 6,
            }}
          />
          <div
            style={{
              width: 8,
              height: 8,
              backgroundColor: "#fff",
              borderRadius: "50%",
              position: "absolute",
              top: 10,
              right: 6,
            }}
          />
        </div>
        {/* Arms */}
        <div
          style={{
            width: 12,
            height: 30,
            backgroundColor: COLORS.characterDark,
            borderRadius: 6,
            position: "absolute",
            top: 5 + armOffset,
            left: -10,
            transform: `rotate(${runCycle % 2 === 0 ? 20 : -20}deg)`,
          }}
        />
        <div
          style={{
            width: 12,
            height: 30,
            backgroundColor: COLORS.characterDark,
            borderRadius: 6,
            position: "absolute",
            top: 5 - armOffset,
            right: -10,
            transform: `rotate(${runCycle % 2 === 0 ? -20 : 20}deg)`,
          }}
        />
        {/* Legs */}
        <div
          style={{
            width: 14,
            height: 35,
            backgroundColor: COLORS.characterDark,
            borderRadius: 6,
            position: "absolute",
            bottom: -30 + legOffset,
            left: 4,
          }}
        />
        <div
          style={{
            width: 14,
            height: 35,
            backgroundColor: COLORS.characterDark,
            borderRadius: 6,
            position: "absolute",
            bottom: -30 - legOffset,
            right: 4,
          }}
        />
      </div>
    </div>
  );
};

// Coin component
const Coin = ({
  x,
  y,
  size = 30,
  opacity = 1,
  frame,
}: {
  x: number;
  y: number;
  size?: number;
  opacity?: number;
  frame: number;
}) => {
  const shimmer = Math.sin(frame * 0.2 + x * 0.1) * 0.2 + 0.8;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: COLORS.coin,
        boxShadow: `inset -${size / 6}px -${size / 6}px 0 ${COLORS.coinDark}`,
        opacity: opacity * shimmer,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...pixelFont,
        fontSize: size * 0.5,
        color: COLORS.coinDark,
        fontWeight: "bold",
      }}
    >
      $
    </div>
  );
};

// Shield component
const Shield = ({
  visible,
  frame,
  daysLeft,
}: {
  visible: boolean;
  frame: number;
  daysLeft: number;
}) => {
  const { fps } = useVideoConfig();
  const pulseScale = 1 + Math.sin(frame * 0.15) * 0.05;
  const glowIntensity = 20 + Math.sin(frame * 0.2) * 10;

  if (!visible) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "35%",
        transform: `translate(-50%, -50%) scale(${pulseScale})`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
      }}
    >
      {/* Shield shape */}
      <div
        style={{
          width: 200,
          height: 240,
          background: `linear-gradient(180deg, ${COLORS.shield}44 0%, ${COLORS.shield}22 100%)`,
          borderRadius: "50% 50% 50% 50% / 30% 30% 70% 70%",
          border: `4px solid ${COLORS.shield}`,
          boxShadow: `0 0 ${glowIntensity}px ${COLORS.shield}, inset 0 0 40px ${COLORS.shieldGlow}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            ...pixelFont,
            fontSize: 16,
            color: COLORS.shield,
            textShadow: `0 0 10px ${COLORS.shield}`,
            textAlign: "center",
          }}
        >
          GRACE
        </div>
        <div
          style={{
            ...pixelFont,
            fontSize: 16,
            color: COLORS.shield,
            textShadow: `0 0 10px ${COLORS.shield}`,
            textAlign: "center",
          }}
        >
          PERIOD
        </div>
        <div
          style={{
            ...pixelFont,
            fontSize: 64,
            color: COLORS.text,
            textShadow: `0 0 20px ${COLORS.shield}`,
          }}
        >
          {daysLeft}
        </div>
        <div
          style={{
            ...pixelFont,
            fontSize: 14,
            color: COLORS.shield,
            textShadow: `0 0 10px ${COLORS.shield}`,
          }}
        >
          DAYS
        </div>
      </div>
    </div>
  );
};

// Balance bar
const BalanceBar = ({
  balance,
  maxBalance,
  frame,
}: {
  balance: number;
  maxBalance: number;
  frame: number;
}) => {
  const percentage = Math.max(0, Math.min(100, (balance / maxBalance) * 100));
  const isLow = percentage < 20;
  const barColor = isLow ? COLORS.danger : COLORS.success;
  const flashOpacity = isLow ? 0.5 + Math.sin(frame * 0.3) * 0.5 : 1;

  return (
    <div
      style={{
        position: "absolute",
        top: 60,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div
        style={{
          ...pixelFont,
          fontSize: 18,
          color: COLORS.text,
          textTransform: "uppercase",
        }}
      >
        Wallet Balance
      </div>
      <div
        style={{
          width: 400,
          height: 40,
          backgroundColor: COLORS.ground,
          borderRadius: 8,
          border: `3px solid ${barColor}`,
          overflow: "hidden",
          boxShadow: `0 0 15px ${barColor}44`,
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: "100%",
            backgroundColor: barColor,
            opacity: flashOpacity,
            boxShadow: `inset 0 -8px 0 ${barColor}88`,
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
        }}
      >
        {[...Array(5)].map((_, i) => (
          <Coin
            key={i}
            x={0}
            y={0}
            size={24}
            opacity={i < Math.ceil(balance / 20) ? 1 : 0.2}
            frame={frame}
          />
        ))}
      </div>
    </div>
  );
};

// Ground with scrolling effect
const ScrollingGround = ({ frame }: { frame: number }) => {
  const scrollOffset = (frame * 8) % 100;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 150,
        backgroundColor: COLORS.ground,
        overflow: "hidden",
      }}
    >
      {/* Ground line details */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            bottom: 60,
            left: i * 100 - scrollOffset,
            width: 60,
            height: 8,
            backgroundColor: COLORS.groundLight,
            borderRadius: 4,
          }}
        />
      ))}
      {/* Top border */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 6,
          backgroundColor: COLORS.groundLight,
        }}
      />
    </div>
  );
};

// Status text
const StatusText = ({
  text,
  color,
  visible,
  frame,
}: {
  text: string;
  color: string;
  visible: boolean;
  frame: number;
}) => {
  const { fps } = useVideoConfig();
  const bounce = Math.sin(frame * 0.2) * 5;

  if (!visible) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 200,
        left: "50%",
        transform: `translateX(-50%) translateY(${bounce}px)`,
        ...pixelFont,
        fontSize: 28,
        color: color,
        textShadow: `0 0 20px ${color}, 0 4px 0 ${color}44`,
        textAlign: "center",
        textTransform: "uppercase",
        letterSpacing: 4,
      }}
    >
      {text}
    </div>
  );
};

// Falling coin animation
const FallingCoin = ({
  startFrame,
  currentFrame,
}: {
  startFrame: number;
  currentFrame: number;
}) => {
  const { fps } = useVideoConfig();
  const localFrame = currentFrame - startFrame;

  if (localFrame < 0) return null;

  const fallProgress = interpolate(localFrame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.quad),
  });

  const y = interpolate(fallProgress, [0, 1], [-100, 580]);
  const rotation = localFrame * 20;
  const scale = 1 + Math.sin(localFrame * 0.5) * 0.1;

  // Sparkle effect on landing
  const landed = localFrame > 20;
  const sparkleOpacity = landed
    ? interpolate(localFrame, [20, 35], [1, 0], { extrapolateRight: "clamp" })
    : 0;

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: y,
          transform: `translateX(-50%) rotate(${rotation}deg) scale(${scale})`,
        }}
      >
        <Coin x={0} y={0} size={60} frame={currentFrame} />
      </div>
      {/* Landing sparkles */}
      {landed && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 580,
            transform: "translateX(-50%)",
            opacity: sparkleOpacity,
          }}
        >
          {[...Array(8)].map((_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            const distance = (localFrame - 20) * 5;
            const sparkleX = Math.cos(angle) * distance;
            const sparkleY = Math.sin(angle) * distance;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: sparkleX,
                  top: sparkleY,
                  width: 10,
                  height: 10,
                  backgroundColor: COLORS.coin,
                  borderRadius: "50%",
                  boxShadow: `0 0 10px ${COLORS.coin}`,
                }}
              />
            );
          })}
        </div>
      )}
    </>
  );
};

// Victory particles
const VictoryParticles = ({
  visible,
  frame,
}: {
  visible: boolean;
  frame: number;
}) => {
  if (!visible) return null;

  return (
    <>
      {[...Array(20)].map((_, i) => {
        const angle = (i / 20) * Math.PI * 2;
        const speed = 3 + (i % 3) * 2;
        const x = 540 + Math.cos(angle) * frame * speed;
        const y = 600 + Math.sin(angle) * frame * speed - frame * 2;
        const opacity = interpolate(frame, [0, 40], [1, 0], {
          extrapolateRight: "clamp",
        });
        const colors = [COLORS.coin, COLORS.shield, COLORS.character, "#fff"];
        const color = colors[i % colors.length];

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: 12,
              height: 12,
              backgroundColor: color,
              borderRadius: i % 2 === 0 ? "50%" : 0,
              opacity,
              boxShadow: `0 0 8px ${color}`,
            }}
          />
        );
      })}
    </>
  );
};

// Title card
const TitleCard = ({ frame }: { frame: number }) => {
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 0.5 * fps], [0, 1], {
    extrapolateRight: "clamp",
  });

  const subtitleOpacity = interpolate(
    frame,
    [0.3 * fps, 0.8 * fps],
    [0, 1],
    { extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        position: "absolute",
        top: 180,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
      }}
    >
      <div
        style={{
          ...pixelFont,
          fontSize: 14,
          color: COLORS.textMuted,
          opacity: subtitleOpacity,
          letterSpacing: 6,
        }}
      >
        OPENFACILITATOR
      </div>
    </div>
  );
};

// Main composition
export const BillingArcade = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();

  // Timeline phases (in frames)
  const PHASE = {
    RUNNING: 0,
    BALANCE_DEPLETING: 2 * fps, // 2s
    WOBBLING: 3.5 * fps, // 3.5s
    SHIELD_APPEARS: 4 * fps, // 4s
    COUNTDOWN: 4.5 * fps, // 4.5s - 7 days countdown
    COIN_DROP: 7.5 * fps, // 7.5s
    VICTORY: 8.5 * fps, // 8.5s
    END: 10 * fps, // 10s
  };

  // Calculate current balance (100 -> 0 during depletion phase)
  const balance = interpolate(
    frame,
    [PHASE.RUNNING, PHASE.BALANCE_DEPLETING, PHASE.WOBBLING],
    [100, 100, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // After coin drop, balance restores
  const finalBalance =
    frame > PHASE.COIN_DROP + 20
      ? interpolate(
          frame,
          [PHASE.COIN_DROP + 20, PHASE.COIN_DROP + 40],
          [0, 100],
          { extrapolateRight: "clamp" }
        )
      : balance;

  // Days countdown (7 -> 1)
  const countdownProgress = interpolate(
    frame,
    [PHASE.COUNTDOWN, PHASE.COIN_DROP],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const daysLeft = Math.max(1, 7 - Math.floor(countdownProgress * 6));

  // Character states
  const isWobbling =
    frame >= PHASE.WOBBLING && frame < PHASE.SHIELD_APPEARS + 10;
  const isJumping = frame >= PHASE.VICTORY && frame < PHASE.VICTORY + 20;
  const shieldVisible = frame >= PHASE.SHIELD_APPEARS && frame < PHASE.VICTORY;

  // Status text
  let statusText = "";
  let statusColor = COLORS.text;
  let showStatus = false;

  if (frame >= PHASE.RUNNING && frame < PHASE.BALANCE_DEPLETING) {
    statusText = "Business Running";
    statusColor = COLORS.success;
    showStatus = true;
  } else if (frame >= PHASE.WOBBLING && frame < PHASE.SHIELD_APPEARS) {
    statusText = "Low Balance!";
    statusColor = COLORS.danger;
    showStatus = true;
  } else if (frame >= PHASE.SHIELD_APPEARS && frame < PHASE.VICTORY) {
    statusText = "Protected";
    statusColor = COLORS.shield;
    showStatus = true;
  } else if (frame >= PHASE.VICTORY) {
    statusText = "Payment Success!";
    statusColor = COLORS.coin;
    showStatus = true;
  }

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        overflow: "hidden",
      }}
    >
      {/* Scanline effect */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)",
          pointerEvents: "none",
          zIndex: 100,
        }}
      />

      {/* Title */}
      <TitleCard frame={frame} />

      {/* Balance bar */}
      <BalanceBar balance={finalBalance} maxBalance={100} frame={frame} />

      {/* Scrolling ground */}
      <ScrollingGround frame={frame} />

      {/* Character */}
      <PixelCharacter
        x={width / 2 - 20}
        y={height - 250}
        frame={frame}
        isWobbling={isWobbling}
        isJumping={isJumping}
      />

      {/* Shield */}
      <Shield visible={shieldVisible} frame={frame} daysLeft={daysLeft} />

      {/* Falling coin */}
      {frame >= PHASE.COIN_DROP && (
        <FallingCoin startFrame={PHASE.COIN_DROP} currentFrame={frame} />
      )}

      {/* Victory particles */}
      <VictoryParticles
        visible={frame >= PHASE.VICTORY}
        frame={frame - PHASE.VICTORY}
      />

      {/* Status text */}
      <StatusText
        text={statusText}
        color={statusColor}
        visible={showStatus}
        frame={frame}
      />

      {/* Bottom branding */}
      <div
        style={{
          position: "absolute",
          bottom: 30,
          left: "50%",
          transform: "translateX(-50%)",
          ...pixelFont,
          fontSize: 12,
          color: COLORS.textMuted,
          letterSpacing: 2,
        }}
      >
        7-DAY GRACE PERIOD • NEVER MISS A BEAT
      </div>
    </AbsoluteFill>
  );
};
