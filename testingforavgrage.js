const allOfPOPDataStats = {
  _id: {
    $oid: "66293a14e1664fe3419f73ee",
  },
  administrativeArea: "totalOfAllArea",
  lastUpdatedSince: {
    $date: "2024-05-21T03:15:02.804Z",
  },
  totalArrayCount: 4080,
  totalDidItRainCount: 298,
  POP0: {
    arrayLength: 2272,
    didItRainCount: 2,
  },
  POP10: {
    arrayLength: 2,
    didItRainCount: 0,
  },
  POP20: {
    arrayLength: 397,
    didItRainCount: 0,
  },
  POP30: {
    arrayLength: 951,
    didItRainCount: 55,
  },
  POP40: {
    arrayLength: 2,
    didItRainCount: 0,
  },
  POP50: {
    arrayLength: 0,
    didItRainCount: 0,
  },
  POP60: {
    arrayLength: 385,
    didItRainCount: 178,
  },
  POP70: {
    arrayLength: 49,
    didItRainCount: 43,
  },
  POP80: {
    arrayLength: 13,
    didItRainCount: 11,
  },
  POP90: {
    arrayLength: 4,
    didItRainCount: 4,
  },
  POP100: {
    arrayLength: 5,
    didItRainCount: 5,
  },
  rainOutOfBlue: [
    {
      administrativeArea: "Jeollabuk-do",
      baseDate: {
        $date: "2024-05-01T12:15:00.000Z",
      },
      didItRain: true,
      POP: 0,
      PTY: 1,
      RN1: 10.2,
      _id: {
        $oid: "664c11b70ba6c74ac7fdcc30",
      },
    },
    {
      administrativeArea: "Ulsan",
      baseDate: {
        $date: "2024-05-04T06:15:00.000Z",
      },
      didItRain: true,
      POP: 0,
      PTY: 1,
      RN1: 0,
      _id: {
        $oid: "664c11b70ba6c74ac7fdcc31",
      },
    },
  ],
};
function calculateArrayLength(startPopulation) {
  let Length = 0;
  let Rain = 0;
  for (let i = startPopulation; i <= 100; i += 10) {
    const key = `POP${i}`;

    if (allOfPOPDataStats[key]) {
      Length += allOfPOPDataStats[key]?.arrayLength;
      Rain += allOfPOPDataStats[key]?.didItRainCount;
    }
  }

  return { Length, Rain };
}
