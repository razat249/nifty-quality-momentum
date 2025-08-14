import React, { useState, useEffect, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from "recharts";
import {
  ChevronDown,
  Info,
  Sliders,
  BarChart2,
  Briefcase,
  Zap,
  Shield,
  Gem,
  TrendingUp,
  Scale,
  Calculator,
  BrainCircuit,
  RefreshCw,
  Target,
  Menu,
  X,
} from "lucide-react";
// --- Data imports (CSV files) ---
import nifty50CSV from "./data/NIFTY50_Historical.csv?raw";
import momentum50CSV from "./data/NIFTY500_MOMENTUM_50_Historical.csv?raw";
import quality50CSV from "./data/NIFTY500_MULTICAP_MOMENTUM_QUALITY_50_Historical.csv?raw";

// --- Helper & Calculation Functions ---

const parseCSV = (csvText) => {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const obj = {};
    headers.forEach((header, i) => {
      let value = values[i]?.trim();
      if (header.toLowerCase().includes("date")) {
        if (value) {
          // Robust parse for formats like '01 Apr 2005'
          const parts = value.split(" ");
          if (parts.length === 3) {
            const [ddStr, monStr, yyyyStr] = parts;
            const day = Number(ddStr);
            const monthNames = [
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "May",
              "Jun",
              "Jul",
              "Aug",
              "Sep",
              "Oct",
              "Nov",
              "Dec",
            ];
            const month = monthNames.findIndex(
              (m) => m.toLowerCase() === monStr.toLowerCase()
            );
            const year = Number(yyyyStr);
            value =
              month >= 0 && Number.isFinite(day) && Number.isFinite(year)
                ? new Date(year, month, day)
                : new Date(value);
          } else {
            value = new Date(value);
          }
        } else {
          value = undefined;
        }
      } else if (header.toLowerCase() === "close") {
        value = value ? parseFloat(value) : undefined;
      }
      obj[header] = value;
    });
    return obj;
  });
};

// Convert high-frequency series (daily) into monthly series.
// Uses the last available close within each year-month and normalizes date to the 1st of that month.
const resampleToMonthly = (rows) => {
  if (!rows || rows.length === 0) return [];
  const monthKeyToRecord = new Map();
  for (const row of rows) {
    const date = row.HistoricalDate;
    const close = row.CLOSE;
    if (!(date instanceof Date) || isNaN(date) || !isFinite(close)) continue;
    const year = date.getFullYear();
    const month = date.getMonth();
    const key = `${year}-${month}`;
    const time = date.getTime();
    const prev = monthKeyToRecord.get(key);
    if (!prev || time > prev.time) {
      monthKeyToRecord.set(key, { year, month, time, close });
    }
  }
  const monthly = Array.from(monthKeyToRecord.values())
    .sort((a, b) => a.time - b.time)
    .map((r) => ({ date: new Date(r.year, r.month + 1, 0), value: r.close }));
  return monthly;
};

const downsampleData = (data, maxPoints = 200) => {
  if (data.length <= maxPoints) return data;
  const step = Math.floor(data.length / maxPoints);
  const sampled = [];
  for (let i = 0; i < data.length; i += step) {
    sampled.push(data[i]);
  }
  if (
    sampled.length > 0 &&
    sampled[sampled.length - 1] !== data[data.length - 1]
  ) {
    sampled.push(data[data.length - 1]);
  }
  return sampled;
};

const calculateMetrics = (data) => {
  if (!data || data.length < 2) return {};
  const riskFreeRate = 0.06505;
  const years =
    (data[data.length - 1].date - data[0].date) /
    (1000 * 60 * 60 * 24 * 365.25);

  const startPrice = data[0].value;
  const endPrice = data[data.length - 1].value;
  const cagr = Math.pow(endPrice / startPrice, 1 / years) - 1;

  const monthlyReturns = [];
  for (let i = 1; i < data.length; i++) {
    monthlyReturns.push(data[i].value / data[i - 1].value - 1);
  }
  const meanReturn =
    monthlyReturns.reduce((a, b) => a + b, 0) / monthlyReturns.length;
  const volatility =
    Math.sqrt(
      monthlyReturns
        .map((r) => Math.pow(r - meanReturn, 2))
        .reduce((a, b) => a + b, 0) / monthlyReturns.length
    ) * Math.sqrt(12);

  const sharpeRatio = (cagr - riskFreeRate) / volatility;

  const downsideReturns = monthlyReturns.filter((r) => r < 0);
  const downsideStd =
    Math.sqrt(
      downsideReturns.map((r) => Math.pow(r, 2)).reduce((a, b) => a + b, 0) /
        downsideReturns.length
    ) * Math.sqrt(12);
  const sortinoRatio = (cagr - riskFreeRate) / downsideStd;

  let peak = 0;
  let maxDrawdown = 0;
  data.forEach((d) => {
    if (d.value > peak) peak = d.value;
    const drawdown = (d.value - peak) / peak;
    if (drawdown < maxDrawdown) maxDrawdown = drawdown;
  });

  const calmarRatio = cagr / Math.abs(maxDrawdown);

  return {
    cagr,
    volatility,
    sharpeRatio,
    sortinoRatio,
    maxDrawdown,
    calmarRatio,
  };
};

const calculateRollingReturns = (data, years) => {
  const windowMonths = years * 12;
  if (data.length < windowMonths) return null;

  const rollingCAGRs = [];
  for (let i = windowMonths; i < data.length; i++) {
    const startValue = data[i - windowMonths].value;
    const endValue = data[i].value;
    const cagr = Math.pow(endValue / startValue, 1 / years) - 1;
    rollingCAGRs.push(cagr);
  }

  if (rollingCAGRs.length === 0) return null;

  rollingCAGRs.sort((a, b) => a - b);
  const min = rollingCAGRs[0];
  const max = rollingCAGRs[rollingCAGRs.length - 1];
  const average = rollingCAGRs.reduce((a, b) => a + b, 0) / rollingCAGRs.length;
  const mid = Math.floor(rollingCAGRs.length / 2);
  const median =
    rollingCAGRs.length % 2 === 0
      ? (rollingCAGRs[mid - 1] + rollingCAGRs[mid]) / 2
      : rollingCAGRs[mid];

  return { average, max, min, median };
};

const formatPercent = (n) =>
  n && isFinite(n) ? `${(n * 100).toFixed(2)}%` : "N/A";
const formatNumber = (n) => (n && isFinite(n) ? n.toFixed(2) : "N/A");

// --- Main App Component ---

const App = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [fundData, setFundData] = useState({});
  const [strategyData, setStrategyData] = useState([]);
  const [isDataReady, setIsDataReady] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // --- Data Processing on Load ---
  useEffect(() => {
    const niftyRaw = parseCSV(nifty50CSV);
    const momentumRaw = parseCSV(momentum50CSV);
    const qualityRaw = parseCSV(quality50CSV);

    const processFund = (name, rawData) => {
      // Resample to month-end values for consistency with existing calculations
      const monthly = resampleToMonthly(rawData);
      const data = monthly
        .filter(
          (d) => d.date instanceof Date && !isNaN(d.date) && isFinite(d.value)
        )
        .sort((a, b) => a.date.getTime() - b.date.getTime());
      const sampled = downsampleData(data);
      const metrics = calculateMetrics(data);
      const rollingReturns = {
        "3yr": calculateRollingReturns(data, 3),
        "5yr": calculateRollingReturns(data, 5),
        "10yr": calculateRollingReturns(data, 10),
      };
      return { name, data, sampled, metrics, rollingReturns };
    };

    const nifty = processFund("Nifty 50", niftyRaw);
    const momentum = processFund("Momentum 50", momentumRaw);
    const quality = processFund("Quality 50", qualityRaw);

    setFundData({ nifty, momentum, quality });

    // --- Backtesting Strategies ---
    const allDates = [
      ...new Set([
        ...nifty.data.map((d) => d.date.getTime()),
        ...momentum.data.map((d) => d.date.getTime()),
        ...quality.data.map((d) => d.date.getTime()),
      ]),
    ].sort();
    const combinedData = allDates
      .map((time) => {
        const date = new Date(time);
        const findValue = (fund, d) => {
          if (!fund || !fund.data || fund.data.length === 0) return null;
          let record = fund.data.find(
            (point) => point.date.getTime() === d.getTime()
          );
          if (record) return record.value;
          let prev = fund.data.filter(
            (point) => point.date.getTime() < d.getTime()
          );
          return prev.length > 0 ? prev[prev.length - 1].value : null;
        };
        return {
          date,
          Nifty: findValue(nifty, date),
          Momentum: findValue(momentum, date),
          Quality: findValue(quality, date),
        };
      })
      .filter((d) => d.Nifty && d.Momentum && d.Quality);

    if (combinedData.length === 0) {
      setStrategyData([]);
      setIsDataReady(true);
      return;
    }

    const strategies = [
      {
        name: "Conservative",
        weights: { Nifty: 0.5, Quality: 0.25, Momentum: 0.25 },
        color: "#3b82f6",
      },
      {
        name: "Equal Weight",
        weights: { Nifty: 0.333, Quality: 0.333, Momentum: 0.333 },
        color: "#10b981",
      },
      {
        name: "Aggressive",
        weights: { Nifty: 0.2, Quality: 0.4, Momentum: 0.4 },
        color: "#f97316",
      },
      {
        name: "Hyper-Aggressive",
        weights: { Nifty: 0, Quality: 0.5, Momentum: 0.5 },
        color: "#ef4444",
      },
      {
        name: "Rajat's Strategy",
        weights: {
          Nifty: 0.25,
          Quality: 0.2,
          Momentum: 0.2,
          MidSmall: 0.15,
          Arbitrage: 0.2,
        },
        color: "#8b5cf6",
      },
      {
        name: "Rajat's (No Arbitrage)",
        weights: {
          Nifty: 0.3125,
          Quality: 0.25,
          Momentum: 0.25,
          MidSmall: 0.1875,
        },
        color: "#d946ef",
      },
    ];

    const backtestedStrategies = strategies.map((strat) => {
      let portfolioHistory = [
        { date: combinedData[0]?.date || new Date(), value: 100 },
      ];

      for (let i = 1; i < combinedData.length; i++) {
        const prev = combinedData[i - 1];
        const curr = combinedData[i];
        let monthlyReturn = 0;

        if (strat.name === "Rajat's Strategy") {
          const niftyReturn = curr.Nifty / prev.Nifty - 1;
          const qualityReturn = curr.Quality / prev.Quality - 1;
          const momentumReturn = curr.Momentum / prev.Momentum - 1;
          const midSmallReturn = niftyReturn * 1.2;
          const arbitrageReturn = 0.065 / 12;

          monthlyReturn =
            strat.weights.Nifty * niftyReturn +
            strat.weights.Quality * qualityReturn +
            strat.weights.Momentum * momentumReturn +
            strat.weights.MidSmall * midSmallReturn +
            strat.weights.Arbitrage * arbitrageReturn;
        } else if (strat.name === "Rajat's (No Arbitrage)") {
          const niftyReturn = curr.Nifty / prev.Nifty - 1;
          const qualityReturn = curr.Quality / prev.Quality - 1;
          const momentumReturn = curr.Momentum / prev.Momentum - 1;
          const midSmallReturn = niftyReturn * 1.2;

          monthlyReturn =
            strat.weights.Nifty * niftyReturn +
            strat.weights.Quality * qualityReturn +
            strat.weights.Momentum * momentumReturn +
            strat.weights.MidSmall * midSmallReturn;
        } else {
          const niftyReturn = curr.Nifty / prev.Nifty - 1;
          const qualityReturn = curr.Quality / prev.Quality - 1;
          const momentumReturn = curr.Momentum / prev.Momentum - 1;

          monthlyReturn =
            strat.weights.Nifty * niftyReturn +
            strat.weights.Quality * qualityReturn +
            strat.weights.Momentum * momentumReturn;
        }
        const newV =
          portfolioHistory[portfolioHistory.length - 1].value *
          (1 + monthlyReturn);
        portfolioHistory.push({ date: curr.date, value: newV });
      }

      const metrics = calculateMetrics(portfolioHistory);
      const rollingReturns = {
        "3yr": calculateRollingReturns(portfolioHistory, 3),
        "5yr": calculateRollingReturns(portfolioHistory, 5),
        "10yr": calculateRollingReturns(portfolioHistory, 10),
      };
      return { ...strat, data: portfolioHistory, metrics, rollingReturns };
    });

    setStrategyData(backtestedStrategies);
    setIsDataReady(true);
  }, []);

  const renderTab = () => {
    if (!isDataReady) {
      return (
        <div className="flex justify-center items-center h-screen">
          <div className="text-xl font-semibold">Loading Dashboard Data...</div>
        </div>
      );
    }
    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardView
            fundData={fundData}
            strategyData={strategyData}
            setActiveTab={setActiveTab}
          />
        );
      case "funds":
        return <FundAnalysisView fundData={fundData} />;
      case "strategies":
        return <StrategyComparisonView strategyData={strategyData} />;
      case "rolling":
        return (
          <RollingReturnsView fundData={fundData} strategyData={strategyData} />
        );
      case "calculators":
        return <CalculatorsView />;
      default:
        return (
          <DashboardView
            fundData={fundData}
            strategyData={strategyData}
            setActiveTab={setActiveTab}
          />
        );
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans text-gray-800">
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-40 bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BrainCircuit className="text-indigo-600 w-7 h-7" />
          <span className="font-bold">Investment Dashboard</span>
        </div>
        <button
          aria-label="Open menu"
          onClick={() => setIsMobileNavOpen(true)}
          className="p-2 rounded-md border border-gray-300 active:scale-95"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <div className="flex">
        <aside className="hidden md:block w-64 bg-white border-r border-gray-200 p-6 min-h-screen fixed">
          <div className="flex items-center space-x-3 mb-10">
            <BrainCircuit className="text-indigo-600 w-10 h-10" />
            <h1 className="text-xl font-bold text-gray-800">
              Investment
              <br />
              Dashboard
            </h1>
          </div>
          <nav className="space-y-2">
            <NavItem
              icon={<BarChart2 />}
              label="Dashboard"
              active={activeTab === "dashboard"}
              onClick={() => setActiveTab("dashboard")}
            />
            <NavItem
              icon={<Briefcase />}
              label="Fund Analysis"
              active={activeTab === "funds"}
              onClick={() => setActiveTab("funds")}
            />
            <NavItem
              icon={<Sliders />}
              label="Strategy Comparison"
              active={activeTab === "strategies"}
              onClick={() => setActiveTab("strategies")}
            />
            <NavItem
              icon={<RefreshCw />}
              label="Rolling Returns"
              active={activeTab === "rolling"}
              onClick={() => setActiveTab("rolling")}
            />
            <NavItem
              icon={<Calculator />}
              label="Calculators"
              active={activeTab === "calculators"}
              onClick={() => setActiveTab("calculators")}
            />
          </nav>
          <div className="absolute bottom-4 left-4 text-xs text-gray-400">
            <p>Built for Client Presentation</p>
            <p>&copy; 2025 Rajat & Co.</p>
          </div>
        </aside>
        <main className="md:ml-64 ml-0 flex-1 p-4 md:p-8">{renderTab()}</main>
      </div>

      {/* Mobile drawer */}
      {isMobileNavOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsMobileNavOpen(false)}
          />
          <aside className="relative bg-white w-64 h-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <BrainCircuit className="text-indigo-600 w-7 h-7" />
                <span className="font-bold">Menu</span>
              </div>
              <button
                aria-label="Close menu"
                onClick={() => setIsMobileNavOpen(false)}
                className="p-2 rounded-md border border-gray-300 active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="space-y-2">
              <NavItem
                icon={<BarChart2 />}
                label="Dashboard"
                active={activeTab === "dashboard"}
                onClick={() => {
                  setActiveTab("dashboard");
                  setIsMobileNavOpen(false);
                }}
              />
              <NavItem
                icon={<Briefcase />}
                label="Fund Analysis"
                active={activeTab === "funds"}
                onClick={() => {
                  setActiveTab("funds");
                  setIsMobileNavOpen(false);
                }}
              />
              <NavItem
                icon={<Sliders />}
                label="Strategy Comparison"
                active={activeTab === "strategies"}
                onClick={() => {
                  setActiveTab("strategies");
                  setIsMobileNavOpen(false);
                }}
              />
              <NavItem
                icon={<RefreshCw />}
                label="Rolling Returns"
                active={activeTab === "rolling"}
                onClick={() => {
                  setActiveTab("rolling");
                  setIsMobileNavOpen(false);
                }}
              />
              <NavItem
                icon={<Calculator />}
                label="Calculators"
                active={activeTab === "calculators"}
                onClick={() => {
                  setActiveTab("calculators");
                  setIsMobileNavOpen(false);
                }}
              />
            </nav>
          </aside>
        </div>
      )}
    </div>
  );
};

const NavItem = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
      active
        ? "bg-indigo-50 text-indigo-700 font-semibold"
        : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
    }`}
  >
    {React.cloneElement(icon, { className: "w-5 h-5" })}
    <span>{label}</span>
  </button>
);

const DashboardView = ({ fundData, strategyData, setActiveTab }) => (
  <div>
    <h1 className="text-2xl md:text-3xl font-bold mb-2">Welcome, Analyst</h1>
    <p className="text-gray-500 mb-8">
      Here's a high-level overview of the funds and strategies.
    </p>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
      {Object.values(fundData).map((fund) => (
        <Card key={fund.name}>
          <h3 className="font-bold text-lg mb-2">{fund.name}</h3>
          <div className="flex justify-between items-baseline">
            <span className="text-2xl font-bold text-indigo-600">
              {formatPercent(fund.metrics.cagr)}
            </span>
            <span className="text-sm text-gray-500">CAGR</span>
          </div>
          <div className="flex justify-between items-baseline mt-1">
            <span className="text-md font-semibold text-red-500">
              {formatPercent(fund.metrics.maxDrawdown)}
            </span>
            <span className="text-sm text-gray-500">Max Drawdown</span>
          </div>
        </Card>
      ))}
    </div>

    <Card>
      <h2 className="text-xl font-bold mb-4">
        Strategy Performance Overview (CAGR)
      </h2>
      <div className="h-64 md:h-80 lg:h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={strategyData.map((s) => ({
              name: s.name,
              CAGR: s.metrics.cagr * 100,
              color: s.color,
            }))}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" unit="%" />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value) => `${value.toFixed(2)}%`}
              cursor={{ fill: "rgba(239, 246, 255, 0.5)" }}
            />
            <Bar dataKey="CAGR" fill="#8884d8" barSize={30}>
              {strategyData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <button
        onClick={() => setActiveTab("strategies")}
        className="mt-4 text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
      >
        Compare All Strategies &rarr;
      </button>
    </Card>
  </div>
);

const FundAnalysisView = ({ fundData }) => {
  const [selectedFund, setSelectedFund] = useState("nifty");
  const fund = fundData[selectedFund];

  if (!fund) return <div>Loading...</div>;

  const performanceData = [
    {
      name: "CAGR",
      value: formatPercent(fund.metrics.cagr),
      icon: <TrendingUp className="text-green-500" />,
      description: "Compound Annual Growth Rate",
    },
    {
      name: "Volatility",
      value: formatPercent(fund.metrics.volatility),
      icon: <Zap className="text-yellow-500" />,
      description: "Standard Deviation (Risk)",
    },
    {
      name: "Max Drawdown",
      value: formatPercent(fund.metrics.maxDrawdown),
      icon: <TrendingUp className="text-red-500 transform rotate-90" />,
      description: "Largest peak-to-trough drop",
    },
    {
      name: "Sharpe Ratio",
      value: formatNumber(fund.metrics.sharpeRatio),
      icon: <Scale className="text-blue-500" />,
      description: "Return per unit of total risk",
    },
    {
      name: "Sortino Ratio",
      value: formatNumber(fund.metrics.sortinoRatio),
      icon: <Shield className="text-teal-500" />,
      description: "Return per unit of downside risk",
    },
    {
      name: "Calmar Ratio",
      value: formatNumber(fund.metrics.calmarRatio),
      icon: <Gem className="text-purple-500" />,
      description: "Return relative to drawdown",
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">
          Individual Fund Analysis
        </h1>
        <div className="relative">
          <select
            value={selectedFund}
            onChange={(e) => setSelectedFund(e.target.value)}
            className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="nifty">Nifty 50</option>
            <option value="quality">Quality 50</option>
            <option value="momentum">Momentum 50</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
        </div>
      </div>

      <Card>
        <h2 className="text-2xl font-bold mb-4">
          {fund.name} - Performance Chart (2005-2025)
        </h2>
        <div className="h-64 md:h-80 lg:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={fund.sampled}
              margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
            >
              <defs>
                <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => new Date(date).getFullYear()}
              />
              <YAxis
                domain={["dataMin", "dataMax"]}
                tickFormatter={(val) => val.toLocaleString()}
              />
              <Tooltip
                labelFormatter={(date) => new Date(date).toLocaleDateString()}
                formatter={(value) => `₹${value.toLocaleString()}`}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#8884d8"
                fillOpacity={1}
                fill="url(#colorUv)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="mt-8">
        <h3 className="text-2xl font-bold mb-4">
          Key Performance Indicators (KPIs)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {performanceData.map((item) => (
            <Card key={item.name} className="text-center">
              <div className="flex justify-center mb-2">{item.icon}</div>
              <p className="text-sm text-gray-500">{item.name}</p>
              <p className="text-2xl font-bold mt-1">{item.value}</p>
              <p className="text-xs text-gray-400 mt-2">{item.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

const StrategyComparisonView = ({ strategyData }) => {
  if (strategyData.length === 0) return <div>Loading strategies...</div>;

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold mb-8">
        Strategy Comparison
      </h1>
      <div className="space-y-8">
        {strategyData.map((strat) => (
          <Card key={strat.name}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              <div className="md:col-span-1">
                <h2
                  className="text-2xl font-bold mb-2 flex items-center"
                  style={{ color: strat.color }}
                >
                  {strat.name}
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  A breakdown of the portfolio's allocation and performance.
                </p>
                <div className="h-40 md:h-48">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={Object.entries(strat.weights).map(
                          ([name, value]) => ({ name, value })
                        )}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        fill="#8884d8"
                        label={({ name, percent }) =>
                          `${name} ${formatPercent(percent)}`
                        }
                      >
                        {Object.entries(strat.weights).map(
                          ([name, value], index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                [
                                  "#3b82f6",
                                  "#10b981",
                                  "#f97316",
                                  "#ef4444",
                                  "#8b5cf6",
                                  "#d946ef",
                                  "#64748b",
                                ][index % 7]
                              }
                            />
                          )
                        )}
                      </Pie>
                      <Tooltip formatter={(value) => formatPercent(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {strat.name.includes("Rajat") && (
                  <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-700">
                    <Info className="inline w-4 h-4 mr-1" />
                    Mid/Small and Arbitrage funds are simulated based on
                    historical correlations for illustrative purposes.
                  </div>
                )}
              </div>
              <div className="md:col-span-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 text-center">
                  <MetricDisplay
                    label="CAGR"
                    value={formatPercent(strat.metrics.cagr)}
                  />
                  <MetricDisplay
                    label="Volatility"
                    value={formatPercent(strat.metrics.volatility)}
                  />
                  <MetricDisplay
                    label="Max Drawdown"
                    value={formatPercent(strat.metrics.maxDrawdown)}
                    className="text-red-600"
                  />
                  <MetricDisplay
                    label="Sharpe Ratio"
                    value={formatNumber(strat.metrics.sharpeRatio)}
                  />
                </div>
                <div className="h-48 mt-4">
                  <ResponsiveContainer>
                    <AreaChart
                      data={downsampleData(strat.data)}
                      margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
                    >
                      <Tooltip
                        labelFormatter={(date) =>
                          new Date(date).toLocaleDateString()
                        }
                        formatter={(value) => `Growth: ${value.toFixed(2)}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={strat.color}
                        fill={strat.color}
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

const RollingReturnsView = ({ fundData, strategyData }) => {
  const [view, setView] = useState("funds"); // 'funds' or 'strategies'

  const dataToShow = view === "funds" ? Object.values(fundData) : strategyData;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">
          Rolling Returns Analysis
        </h1>
        <div className="flex space-x-2 p-1 bg-gray-200 rounded-lg overflow-x-auto">
          <button
            onClick={() => setView("funds")}
            className={`px-4 py-1 rounded-md text-sm font-semibold ${
              view === "funds" ? "bg-white shadow" : "text-gray-600"
            }`}
          >
            Funds
          </button>
          <button
            onClick={() => setView("strategies")}
            className={`px-4 py-1 rounded-md text-sm font-semibold ${
              view === "strategies" ? "bg-white shadow" : "text-gray-600"
            }`}
          >
            Strategies
          </button>
        </div>
      </div>
      <p className="text-gray-500 mb-6">
        This shows the range of outcomes for different investment periods,
        highlighting performance consistency.
      </p>
      <div className="space-y-6">
        {dataToShow.map((item) => (
          <Card key={item.name}>
            <h2
              className="text-xl font-bold mb-4"
              style={{ color: item.color || "#1f2937" }}
            >
              {item.name}
            </h2>
            <RollingReturnTable rollingReturns={item.rollingReturns} />
          </Card>
        ))}
      </div>
    </div>
  );
};

const RollingReturnTable = ({ rollingReturns }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left">
      <thead>
        <tr className="border-b bg-gray-50">
          <th className="p-3 text-sm font-semibold text-gray-600">Period</th>
          <th className="p-3 text-sm font-semibold text-gray-600 text-center">
            Average
          </th>
          <th className="p-3 text-sm font-semibold text-gray-600 text-center">
            Min
          </th>
          <th className="p-3 text-sm font-semibold text-gray-600 text-center">
            Max
          </th>
          <th className="p-3 text-sm font-semibold text-gray-600 text-center">
            Median
          </th>
        </tr>
      </thead>
      <tbody>
        {["3yr", "5yr", "10yr"].map((period) => {
          const data = rollingReturns[period];
          return (
            <tr key={period} className="border-b">
              <td className="p-3 font-medium">
                {period.replace("yr", " Year")}
              </td>
              <td className="p-3 text-center font-semibold text-blue-600">
                {formatPercent(data?.average)}
              </td>
              <td className="p-3 text-center text-red-600">
                {formatPercent(data?.min)}
              </td>
              <td className="p-3 text-center text-green-600">
                {formatPercent(data?.max)}
              </td>
              <td className="p-3 text-center">{formatPercent(data?.median)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

const CalculatorsView = () => {
  const [sipAmount, setSipAmount] = useState(10000);
  const [sipYears, setSipYears] = useState(10);
  const [sipRate, setSipRate] = useState(15);

  const [lumpAmount, setLumpAmount] = useState(100000);
  const [lumpYears, setLumpYears] = useState(10);
  const [lumpRate, setLumpRate] = useState(12);

  const sipResult = useMemo(() => {
    const i = sipRate / 100 / 12;
    const n = sipYears * 12;
    const futureValue = sipAmount * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
    const invested = sipAmount * n;
    return { futureValue, invested };
  }, [sipAmount, sipYears, sipRate]);

  const lumpResult = useMemo(() => {
    const futureValue = lumpAmount * Math.pow(1 + lumpRate / 100, lumpYears);
    return { futureValue, invested: lumpAmount };
  }, [lumpAmount, lumpYears, lumpRate]);

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold mb-8">
        Financial Calculators
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <h2 className="text-2xl font-bold mb-6">SIP Calculator</h2>
          <div className="space-y-6">
            <InputSlider
              label="Monthly Investment (₹)"
              value={sipAmount}
              setValue={setSipAmount}
              min={1000}
              max={100000}
              step={1000}
            />
            <InputSlider
              label="Investment Period (Years)"
              value={sipYears}
              setValue={setSipYears}
              min={1}
              max={40}
              step={1}
            />
            <InputSlider
              label="Expected Annual Return (%)"
              value={sipRate}
              setValue={setSipRate}
              min={1}
              max={30}
              step={0.5}
            />
          </div>
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-lg text-gray-500">Invested Amount</p>
            <p className="text-3xl font-bold text-gray-800 mb-4">
              ₹{sipResult.invested.toLocaleString("en-IN")}
            </p>
            <p className="text-lg text-gray-500">Estimated Future Value</p>
            <p className="text-4xl font-bold text-indigo-600">
              ₹
              {sipResult.futureValue.toLocaleString("en-IN", {
                maximumFractionDigits: 0,
              })}
            </p>
          </div>
        </Card>
        <Card>
          <h2 className="text-2xl font-bold mb-6">Lumpsum Calculator</h2>
          <div className="space-y-6">
            <InputSlider
              label="Total Investment (₹)"
              value={lumpAmount}
              setValue={setLumpAmount}
              min={10000}
              max={10000000}
              step={10000}
            />
            <InputSlider
              label="Investment Period (Years)"
              value={lumpYears}
              setValue={setLumpYears}
              min={1}
              max={40}
              step={1}
            />
            <InputSlider
              label="Expected Annual Return (%)"
              value={lumpRate}
              setValue={setLumpRate}
              min={1}
              max={30}
              step={0.5}
            />
          </div>
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-lg text-gray-500">Invested Amount</p>
            <p className="text-3xl font-bold text-gray-800 mb-4">
              ₹{lumpResult.invested.toLocaleString("en-IN")}
            </p>
            <p className="text-lg text-gray-500">Estimated Future Value</p>
            <p className="text-4xl font-bold text-green-600">
              ₹
              {lumpResult.futureValue.toLocaleString("en-IN", {
                maximumFractionDigits: 0,
              })}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

const Card = ({ children, className = "" }) => (
  <div
    className={`bg-white border border-gray-200 rounded-xl p-6 shadow-sm ${className}`}
  >
    {children}
  </div>
);

const MetricDisplay = ({ label, value, className = "" }) => (
  <div className="bg-gray-50 p-4 rounded-lg">
    <p className="text-sm text-gray-500">{label}</p>
    <p className={`text-2xl font-bold mt-1 ${className}`}>{value}</p>
  </div>
);

const InputSlider = ({ label, value, setValue, min, max, step }) => (
  <div>
    <div className="flex justify-between items-center mb-1">
      <label className="text-gray-600 font-medium">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-32 text-right font-semibold border-b-2 border-gray-300 focus:border-indigo-500 focus:outline-none"
      />
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => setValue(Number(e.target.value))}
      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
    />
  </div>
);

export default App;
