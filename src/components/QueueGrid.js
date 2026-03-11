"use client";

export default function QueueGrid({
  queue,
  formatShortToken,
  handleDoubleClickFinish,
  currentTime,
}) {
  const getTokenStyle = (token) => {
    if (token.updated_at) {
      const requestedTime = new Date(token.updated_at).getTime();
      if (currentTime - requestedTime > 180000) {
        return { backgroundColor: "#dc2626", color: "#ffffff" };
      }
    }

    const pureNum = parseInt(formatShortToken(token.display_token), 10) || 0;
    const rangeGroup = Math.floor(Math.max(0, pureNum - 1) / 100) % 5;
    const colorIndex = pureNum % 2 === 0 ? 0 : 1;

    const bgCombos = [
      ["#663300", "#996633"],
      ["#666666", "#999999"],
      ["#663366", "#9900CC"],
      ["#0066CC", "#0099FF"],
      ["#336600", "#669900"],
    ];

    const textCombos = [
      ["#FFFFFF", "#000000"],
      ["#FFFFFF", "#000000"],
      ["#FFFFFF", "#000000"],
      ["#FFFFFF", "#000000"],
      ["#FFFFFF", "#000000"],
    ];

    return {
      backgroundColor: bgCombos[rangeGroup][colorIndex],
      color: textCombos[rangeGroup][colorIndex],
    };
  };

  const getDynamicStyles = (count) => {
    if (count === 1)
      return {
        grid: "grid-cols-1",
        card: "min-h-[65vh]",
        token: "text-[50vw] md:text-[35vw] leading-[0.8]",
        bottomBar: "text-3xl md:text-5xl py-4",
      };
    if (count === 2)
      return {
        grid: "grid-cols-1 md:grid-cols-2",
        card: "min-h-[50vh]",
        token: "text-[35vw] md:text-[22vw] leading-[0.8]",
        bottomBar: "text-2xl md:text-3xl py-3",
      };
    if (count <= 4)
      return {
        grid: "grid-cols-2",
        card: "min-h-[35vh]",
        token: "text-[28vw] md:text-[15vw] leading-[0.8]",
        bottomBar: "text-xl md:text-2xl py-2",
      };
    if (count <= 6)
      return {
        grid: "grid-cols-2 md:grid-cols-3",
        card: "min-h-[25vh]",
        token: "text-8xl md:text-[11vw] leading-[0.8]",
        bottomBar: "text-lg md:text-xl py-2",
      };
    if (count <= 8)
      return {
        grid: "grid-cols-2 md:grid-cols-4",
        card: "min-h-[20vh]",
        token: "text-[20vw] md:text-[8vw] leading-[0.8]",
        bottomBar: "text-sm md:text-lg py-1.5",
      };
    return {
      grid: "grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
      card: "min-h-[15vh]",
      token: "text-[15vw] md:text-[5vw] leading-[0.8]",
      bottomBar: "text-xs md:text-sm py-1",
    };
  };

  const dynamicStyles = getDynamicStyles(queue.length);

  if (queue.length === 0) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center border-2 border-dashed border-gray-800 rounded-3xl opacity-50 bg-gray-900/20">
        <p className="text-2xl font-black text-gray-600 uppercase tracking-widest">
          Awaiting Scans
        </p>
      </div>
    );
  }

  return (
    <div
      className={`grid ${dynamicStyles.grid} gap-4 transition-all duration-300`}
    >
      {queue.map((token) => (
        <div
          key={token.token_id}
          onDoubleClick={() => handleDoubleClickFinish(token.token_id)}
          style={getTokenStyle(token)}
          className={`relative rounded-3xl flex flex-col justify-between text-center shadow-2xl cursor-pointer hover:brightness-110 hover:scale-105 active:scale-95 transition-all select-none border-4 border-black/20 overflow-hidden ${dynamicStyles.card}`}
          title="Double-click to mark as RETURNED"
        >
          <div className="flex-1 flex items-center justify-center w-full overflow-hidden">
            <h1
              className={`font-black drop-shadow-lg tracking-tighter w-full text-center ${dynamicStyles.token}`}
            >
              {formatShortToken(token.display_token) || token.token_id}
            </h1>
          </div>
          <div
            className={`w-full bg-black/25 backdrop-blur-sm flex items-center justify-center px-4 ${dynamicStyles.bottomBar}`}
          >
            <p className="font-bold uppercase tracking-widest drop-shadow-md truncate w-full text-white/90">
              {token.bag_count} Bag(s) - {token.name}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
