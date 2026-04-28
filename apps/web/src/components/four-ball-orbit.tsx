function FourBallOrbit({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <>
      <style>{`
        @keyframes four-ball-orbit-rotate {
          0% { transform: rotate(0deg) scale(0.8); }
          50% { transform: rotate(360deg) scale(1.2); }
          100% { transform: rotate(720deg) scale(0.8); }
        }
        @keyframes four-ball-orbit-ball1 {
          0% { box-shadow: 30px 0 0 #94A3B8; }
          50% {
            box-shadow: 0 0 0 #94A3B8;
            margin-bottom: 0;
            transform: translate(15px, 15px);
          }
          100% {
            box-shadow: 30px 0 0 #94A3B8;
            margin-bottom: 10px;
          }
        }
        @keyframes four-ball-orbit-ball2 {
          0% { box-shadow: 30px 0 0 #2E5AA7; }
          50% {
            box-shadow: 0 0 0 #2E5AA7;
            margin-top: -20px;
            transform: translate(15px, 15px);
          }
          100% {
            box-shadow: 30px 0 0 #2E5AA7;
            margin-top: 0;
          }
        }
        .four-ball-orbit {
          position: relative;
          width: 50px;
          height: 50px;
          animation: four-ball-orbit-rotate 1s infinite;
        }
        .four-ball-orbit::before,
        .four-ball-orbit::after {
          content: '';
          display: block;
          width: 20px;
          height: 20px;
          border-radius: 50%;
        }
        .four-ball-orbit::before {
          background-color: #2E5AA7;
          box-shadow: 30px 0 0 #94A3B8;
          margin-bottom: 10px;
          animation: four-ball-orbit-ball1 1s infinite;
        }
        .four-ball-orbit::after {
          background-color: #94A3B8;
          box-shadow: 30px 0 0 #2E5AA7;
          animation: four-ball-orbit-ball2 1s infinite;
        }
      `}</style>
      <span
        role="status"
        className={`four-ball-orbit${className ? ` ${className}` : ""}`}
        {...props}
      >
        <span className="sr-only">Loading</span>
      </span>
    </>
  );
}

export { FourBallOrbit };
