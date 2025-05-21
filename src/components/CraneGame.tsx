'use client';

import { useState, useEffect, useRef } from 'react';
import styles from '../styles/CraneGame.module.css';

interface Prize {
  id: number;
  name: string;
  image: string;
  position: { x: number; y: number };
  width: number;
  height: number;
  caught?: boolean;
}

const CraneGame = () => {
  const [cranePosition, setCranePosition] = useState({ x: 50, y: 20 });
  const [clawPosition, setClawPosition] = useState({ x: 50, y: 20 });
  const [isLowering, setIsLowering] = useState(false);
  const [isGrabbing, setIsGrabbing] = useState(false);
  const [isRaising, setIsRaising] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [gameMessage, setGameMessage] = useState('Move the crane with arrow keys and press Space to lower the claw!');
  const [caughtPrize, setCaughtPrize] = useState<Prize | null>(null);
  const [prizes, setPrizes] = useState<Prize[]>([
    { id: 1, name: 'Teddy Bear', image: '/images/teddy.svg', position: { x: 30, y: 70 }, width: 10, height: 10 },
    { id: 2, name: 'Robot Toy', image: '/images/robot.svg', position: { x: 50, y: 75 }, width: 12, height: 12 },
    { id: 3, name: 'Plush Dog', image: '/images/dog.svg', position: { x: 70, y: 72 }, width: 11, height: 11 },
    { id: 4, name: 'Stuffed Cat', image: '/images/cat.svg', position: { x: 20, y: 80 }, width: 9, height: 9 },
    { id: 5, name: 'Action Figure', image: '/images/figure.svg', position: { x: 80, y: 78 }, width: 8, height: 10 },
  ]);
  const [wonPrizes, setWonPrizes] = useState<Prize[]>([]);
  const [movementEnabled, setMovementEnabled] = useState(true);
  const gameAreaRef = useRef<HTMLDivElement>(null);

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!movementEnabled) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          setCranePosition(prev => ({ ...prev, x: Math.max(prev.x - 2, 10) }));
          break;
        case 'ArrowRight':
          setCranePosition(prev => ({ ...prev, x: Math.min(prev.x + 2, 90) }));
          break;
        case ' ':
          if (!isLowering && !isGrabbing && !isRaising && !isReturning) {
            setIsLowering(true);
            setMovementEnabled(false);
            setGameMessage('Lowering the claw...');
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLowering, isGrabbing, isRaising, isReturning, movementEnabled]);

  // Update claw position to follow crane
  useEffect(() => {
    if (!isLowering && !isGrabbing && !isRaising && !isReturning) {
      setClawPosition({ x: cranePosition.x, y: cranePosition.y });
    }
  }, [cranePosition, isLowering, isGrabbing, isRaising, isReturning]);

  // Handle claw animation
  useEffect(() => {
    let animationFrame: number;
    
    const animateClaw = () => {
      if (isLowering) {
        setClawPosition(prev => {
          const newY = prev.y + 1;
          if (newY >= 85) {
            setIsLowering(false);
            setIsGrabbing(true);
            setGameMessage('Grabbing...');
            return { ...prev, y: 85 };
          }
          return { ...prev, y: newY };
        });
      } else if (isGrabbing) {
        // Check if we caught a prize
        const potentialPrize = prizes.find(prize => 
          !prize.caught &&
          Math.abs(clawPosition.x - prize.position.x) < prize.width / 2 &&
          Math.abs(clawPosition.y - prize.position.y) < prize.height / 2
        );
        
        // 60% chance of successfully grabbing if positioned correctly
        const grabSuccess = potentialPrize && Math.random() < 0.6;
        
        if (grabSuccess) {
          setCaughtPrize(potentialPrize);
          setPrizes(prev => prev.map(p => 
            p.id === potentialPrize.id ? { ...p, caught: true } : p
          ));
          setGameMessage(`Caught a ${potentialPrize.name}!`);
        } else {
          setGameMessage('Nothing caught. Try again!');
        }
        
        setIsGrabbing(false);
        setIsRaising(true);
      } else if (isRaising) {
        setClawPosition(prev => {
          const newY = prev.y - 1;
          if (newY <= 20) {
            setIsRaising(false);
            setIsReturning(true);
            return { ...prev, y: 20 };
          }
          return { ...prev, y: newY };
        });
      } else if (isReturning) {
        setClawPosition(prev => {
          const targetX = 50;
          const dx = (targetX - prev.x) * 0.1;
          const newX = prev.x + dx;
          
          if (Math.abs(newX - targetX) < 0.5) {
            setIsReturning(false);
            setCranePosition({ x: targetX, y: 20 });
            setMovementEnabled(true);
            
            if (caughtPrize) {
              setWonPrizes(prev => [...prev, caughtPrize]);
              setCaughtPrize(null);
              setGameMessage('You won a prize! Try again?');
            } else {
              setGameMessage('Move the crane and try again!');
            }
            
            return { x: targetX, y: 20 };
          }
          
          return { ...prev, x: newX };
        });
      }
      
      animationFrame = requestAnimationFrame(animateClaw);
    };
    
    animationFrame = requestAnimationFrame(animateClaw);
    return () => cancelAnimationFrame(animationFrame);
  }, [isLowering, isGrabbing, isRaising, isReturning, prizes, clawPosition, caughtPrize]);

  return (
    <div className={styles.gameContainer}>
      <div className={styles.gameHeader}>
        <h1>Crane Game</h1>
        <p className={styles.gameMessage}>{gameMessage}</p>
        <div className={styles.controls}>
          <p>Controls: Arrow Keys to move, Space to lower claw</p>
        </div>
      </div>
      
      <div className={styles.gameArea} ref={gameAreaRef}>
        {/* Crane Machine */}
        <div className={styles.craneMachine}>
          {/* Crane Arm */}
          <div 
            className={styles.craneArm} 
            style={{ left: `${cranePosition.x}%` }}
          >
            <div className={styles.craneVertical}></div>
          </div>
          
          {/* Claw */}
          <div 
            className={styles.claw} 
            style={{ 
              left: `${clawPosition.x}%`, 
              top: `${clawPosition.y}%`,
              transform: isGrabbing ? 'scale(0.8)' : 'scale(1)'
            }}
          >
            {caughtPrize && (
              <div 
                className={styles.caughtPrize}
                style={{ 
                  backgroundImage: `url(${caughtPrize.image})`,
                  width: `${caughtPrize.width}%`,
                  height: `${caughtPrize.height}%`
                }}
              />
            )}
          </div>
          
          {/* Prizes */}
          {prizes.map(prize => !prize.caught && (
            <div 
              key={prize.id}
              className={styles.prize}
              style={{
                left: `${prize.position.x}%`,
                top: `${prize.position.y}%`,
                width: `${prize.width}%`,
                height: `${prize.height}%`,
                backgroundImage: `url(${prize.image})`
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Prize Collection */}
      <div className={styles.prizeCollection}>
        <h2>Your Prizes:</h2>
        <div className={styles.wonPrizes}>
          {wonPrizes.length === 0 ? (
            <p>No prizes yet. Try your luck!</p>
          ) : (
            wonPrizes.map(prize => (
              <div key={prize.id} className={styles.wonPrize}>
                <div 
                  className={styles.prizeImage} 
                  style={{ backgroundImage: `url(${prize.image})` }}
                />
                <p>{prize.name}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CraneGame;
