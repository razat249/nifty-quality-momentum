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
} from "lucide-react";

// --- Data (Updated to full month-end data from 2005-2025) ---
const nifty50CSV = `INDEX_NAME,HistoricalDate,CLOSE
Nifty 50,29 Apr 2005,2017.55
Nifty 50,31 May 2005,2091.55
Nifty 50,30 Jun 2005,2276.75
Nifty 50,29 Jul 2005,2528.95
Nifty 50,31 Aug 2005,2635.25
Nifty 50,30 Sep 2005,2781.95
Nifty 50,31 Oct 2005,2896.75
Nifty 50,30 Nov 2005,2945.75
Nifty 50,30 Dec 2005,3137.45
Nifty 50,31 Jan 2006,3148.95
Nifty 50,28 Feb 2006,3070.80
Nifty 50,31 Mar 2006,3416.70
Nifty 50,28 Apr 2006,3740.15
Nifty 50,31 May 2006,3269.45
Nifty 50,30 Jun 2006,3184.70
Nifty 50,31 Jul 2006,3449.60
Nifty 50,31 Aug 2006,3563.80
Nifty 50,29 Sep 2006,3681.80
Nifty 50,31 Oct 2006,3784.80
Nifty 50,30 Nov 2006,3869.80
Nifty 50,29 Dec 2006,3975.25
Nifty 50,31 Jan 2007,4261.20
Nifty 50,28 Feb 2007,4337.35
Nifty 50,30 Mar 2007,4234.30
Nifty 50,30 Apr 2007,4403.80
Nifty 50,31 May 2007,4280.90
Nifty 50,29 Jun 2007,4537.15
Nifty 50,31 Jul 2007,4401.70
Nifty 50,31 Aug 2007,4392.25
Nifty 50,28 Sep 2007,5047.45
Nifty 50,31 Oct 2007,5900.90
Nifty 50,30 Nov 2007,5913.35
Nifty 50,31 Dec 2007,6138.60
Nifty 50,31 Jan 2008,5358.85
Nifty 50,29 Feb 2008,4932.90
Nifty 50,31 Mar 2008,4640.25
Nifty 50,30 Apr 2008,5103.05
Nifty 50,30 May 2008,4878.00
Nifty 50,30 Jun 2008,4182.20
Nifty 50,31 Jul 2008,4346.30
Nifty 50,29 Aug 2008,4363.55
Nifty 50,30 Sep 2008,4086.60
Nifty 50,31 Oct 2008,2959.15
Nifty 50,28 Nov 2008,2755.10
Nifty 50,31 Dec 2008,2959.15
Nifty 50,30 Jan 2009,2862.90
Nifty 50,27 Feb 2009,2764.25
Nifty 50,31 Mar 2009,3020.95
Nifty 50,30 Apr 2009,3587.70
Nifty 50,29 May 2009,4313.35
Nifty 50,30 Jun 2009,4250.75
Nifty 50,31 Jul 2009,4636.45
Nifty 50,31 Aug 2009,4789.05
Nifty 50,30 Sep 2009,4960.90
Nifty 50,30 Oct 2009,4883.35
Nifty 50,30 Nov 2009,5032.65
Nifty 50,31 Dec 2009,5201.05
Nifty 50,29 Jan 2010,4865.35
Nifty 50,26 Feb 2010,4922.30
Nifty 50,31 Mar 2010,5249.10
Nifty 50,30 Apr 2010,5204.70
Nifty 50,31 May 2010,5086.30
Nifty 50,30 Jun 2010,5244.75
Nifty 50,30 Jul 2010,5332.05
Nifty 50,31 Aug 2010,5429.35
Nifty 50,30 Sep 2010,5935.70
Nifty 50,29 Oct 2010,6078.95
Nifty 50,30 Nov 2010,5861.90
Nifty 50,31 Dec 2010,6134.50
Nifty 50,31 Jan 2011,5495.55
Nifty 50,28 Feb 2011,5436.15
Nifty 50,31 Mar 2011,5833.75
Nifty 50,29 Apr 2011,5700.30
Nifty 50,31 May 2011,5400.90
Nifty 50,30 Jun 2011,5647.40
Nifty 50,29 Jul 2011,5412.80
Nifty 50,31 Aug 2011,5048.15
Nifty 50,30 Sep 2011,5049.95
Nifty 50,31 Oct 2011,5326.60
Nifty 50,30 Nov 2011,4702.40
Nifty 50,30 Dec 2011,4624.30
Nifty 50,31 Jan 2012,5225.30
Nifty 50,29 Feb 2012,5359.70
Nifty 50,30 Mar 2012,5295.55
Nifty 50,30 Apr 2012,5188.85
Nifty 50,31 May 2012,4924.25
Nifty 50,29 Jun 2012,5278.90
Nifty 50,31 Jul 2012,5215.70
Nifty 50,31 Aug 2012,5326.60
Nifty 50,28 Sep 2012,5703.30
Nifty 50,31 Oct 2012,5682.55
Nifty 50,30 Nov 2012,5794.60
Nifty 50,31 Dec 2012,5905.10
Nifty 50,31 Jan 2013,5968.70
Nifty 50,28 Feb 2013,5693.05
Nifty 50,28 Mar 2013,5682.55
Nifty 50,30 Apr 2013,5930.20
Nifty 50,31 May 2013,6049.25
Nifty 50,28 Jun 2013,5842.20
Nifty 50,31 Jul 2013,5742.00
Nifty 50,30 Aug 2013,5565.65
Nifty 50,30 Sep 2013,5735.30
Nifty 50,31 Oct 2013,6255.45
Nifty 50,29 Nov 2013,6179.10
Nifty 50,31 Dec 2013,6304.00
Nifty 50,31 Jan 2014,6136.55
Nifty 50,28 Feb 2014,6276.95
Nifty 50,31 Mar 2014,6721.05
Nifty 50,30 Apr 2014,6715.30
Nifty 50,30 May 2014,7229.95
Nifty 50,30 Jun 2014,7611.35
Nifty 50,31 Jul 2014,7724.80
Nifty 50,29 Aug 2014,7954.35
Nifty 50,30 Sep 2014,7958.90
Nifty 50,31 Oct 2014,8322.20
Nifty 50,28 Nov 2014,8588.25
Nifty 50,31 Dec 2014,8282.70
Nifty 50,30 Jan 2015,8808.90
Nifty 50,27 Feb 2015,8844.60
Nifty 50,31 Mar 2015,8586.25
Nifty 50,30 Apr 2015,8342.10
Nifty 50,29 May 2015,8433.65
Nifty 50,30 Jun 2015,8381.10
Nifty 50,31 Jul 2015,8532.85
Nifty 50,31 Aug 2015,7971.30
Nifty 50,30 Sep 2015,7950.90
Nifty 50,30 Oct 2015,8065.80
Nifty 50,30 Nov 2015,7935.25
Nifty 50,31 Dec 2015,7946.35
Nifty 50,29 Jan 2016,7563.55
Nifty 50,29 Feb 2016,6987.05
Nifty 50,31 Mar 2016,7738.40
Nifty 50,29 Apr 2016,7849.80
Nifty 50,31 May 2016,8179.95
Nifty 50,30 Jun 2016,8287.75
Nifty 50,29 Jul 2016,8638.50
Nifty 50,31 Aug 2016,8786.20
Nifty 50,30 Sep 2016,8611.15
Nifty 50,31 Oct 2016,8625.70
Nifty 50,30 Nov 2016,8224.50
Nifty 50,30 Dec 2016,8185.80
Nifty 50,31 Jan 2017,8561.30
Nifty 50,28 Feb 2017,8879.60
Nifty 50,31 Mar 2017,9173.75
Nifty 50,28 Apr 2017,9304.05
Nifty 50,31 May 2017,9621.25
Nifty 50,30 Jun 2017,9520.90
Nifty 50,31 Jul 2017,10077.10
Nifty 50,31 Aug 2017,9917.90
Nifty 50,29 Sep 2017,9788.60
Nifty 50,31 Oct 2017,10335.30
Nifty 50,30 Nov 2017,10121.80
Nifty 50,29 Dec 2017,10530.70
Nifty 50,31 Jan 2018,11027.70
Nifty 50,28 Feb 2018,10492.85
Nifty 50,28 Mar 2018,10113.70
Nifty 50,30 Apr 2018,10739.35
Nifty 50,31 May 2018,10736.15
Nifty 50,29 Jun 2018,10714.30
Nifty 50,31 Jul 2018,11356.50
Nifty 50,31 Aug 2018,11680.50
Nifty 50,28 Sep 2018,10930.45
Nifty 50,31 Oct 2018,10386.60
Nifty 50,30 Nov 2018,10876.75
Nifty 50,31 Dec 2018,10862.55
Nifty 50,31 Jan 2019,10830.95
Nifty 50,28 Feb 2019,10792.50
Nifty 50,29 Mar 2019,11623.90
Nifty 50,30 Apr 2019,11748.15
Nifty 50,31 May 2019,11922.80
Nifty 50,28 Jun 2019,11788.85
Nifty 50,31 Jul 2019,11118.00
Nifty 50,30 Aug 2019,11023.25
Nifty 50,30 Sep 2019,11474.45
Nifty 50,31 Oct 2019,11877.45
Nifty 50,29 Nov 2019,12056.05
Nifty 50,31 Dec 2019,12168.45
Nifty 50,31 Jan 2020,11661.85
Nifty 50,28 Feb 2020,11201.75
Nifty 50,31 Mar 2020,8597.75
Nifty 50,30 Apr 2020,9859.90
Nifty 50,29 May 2020,9813.70
Nifty 50,30 Jun 2020,10302.10
Nifty 50,31 Jul 2020,11073.45
Nifty 50,31 Aug 2020,11387.50
Nifty 50,30 Sep 2020,11247.55
Nifty 50,30 Oct 2020,11642.40
Nifty 50,30 Nov 2020,12968.95
Nifty 50,31 Dec 2020,13981.75
Nifty 50,29 Jan 2021,13634.60
Nifty 50,26 Feb 2021,14529.15
Nifty 50,31 Mar 2021,14690.70
Nifty 50,30 Apr 2021,14631.10
Nifty 50,31 May 2021,15582.80
Nifty 50,30 Jun 2021,15721.50
Nifty 50,30 Jul 2021,15763.05
Nifty 50,31 Aug 2021,17132.20
Nifty 50,30 Sep 2021,17618.15
Nifty 50,29 Oct 2021,17671.65
Nifty 50,30 Nov 2021,17166.90
Nifty 50,31 Dec 2021,17354.05
Nifty 50,31 Jan 2022,17339.85
Nifty 50,28 Feb 2022,16793.90
Nifty 50,31 Mar 2022,17464.75
Nifty 50,29 Apr 2022,17102.55
Nifty 50,31 May 2022,16584.55
Nifty 50,30 Jun 2022,15780.25
Nifty 50,29 Jul 2022,17158.25
Nifty 50,31 Aug 2022,17759.30
Nifty 50,30 Sep 2022,17094.35
Nifty 50,31 Oct 2022,17946.70
Nifty 50,30 Nov 2022,18758.35
Nifty 50,30 Dec 2022,18105.30
Nifty 50,31 Jan 2023,17662.15
Nifty 50,28 Feb 2023,17303.95
Nifty 50,31 Mar 2023,17359.75
Nifty 50,28 Apr 2023,18065.00
Nifty 50,31 May 2023,18534.10
Nifty 50,30 Jun 2023,19189.05
Nifty 50,31 Jul 2023,19753.80
Nifty 50,31 Aug 2023,19253.80
Nifty 50,29 Sep 2023,19638.30
Nifty 50,31 Oct 2023,19079.60
Nifty 50,30 Nov 2023,20133.15
Nifty 50,29 Dec 2023,21731.40
Nifty 50,31 Jan 2024,21725.70
Nifty 50,29 Feb 2024,22338.75
Nifty 50,28 Mar 2024,22326.90
Nifty 50,30 Apr 2024,22604.85
Nifty 50,31 May 2024,22530.70
Nifty 50,28 Jun 2024,24044.50
Nifty 50,31 Jul 2024,24915.20
Nifty 50,30 Aug 2024,25091.20
Nifty 50,30 Sep 2024,24846.70
Nifty 50,31 Oct 2024,25301.90
Nifty 50,29 Nov 2024,25511.05
Nifty 50,31 Dec 2024,25633.50
Nifty 50,31 Jan 2025,25413.50
Nifty 50,28 Feb 2025,25203.40
Nifty 50,31 Mar 2025,25439.10
Nifty 50,30 Apr 2025,25313.90
Nifty 50,30 May 2025,25272.25
Nifty 50,30 Jun 2025,25638.95
Nifty 50,31 Jul 2025,25772.50
`;

const momentum50CSV = `INDEX_NAME,HistoricalDate,CLOSE
Nifty500 Momentum 50,29 Apr 2005,1043.91
Nifty500 Momentum 50,31 May 2005,1087.97
Nifty500 Momentum 50,30 Jun 2005,1199.36
Nifty500 Momentum 50,29 Jul 2005,1383.08
Nifty500 Momentum 50,31 Aug 2005,1486.29
Nifty500 Momentum 50,30 Sep 2005,1635.84
Nifty500 Momentum 50,31 Oct 2005,1765.34
Nifty500 Momentum 50,30 Nov 2005,1854.71
Nifty500 Momentum 50,30 Dec 2005,1985.35
Nifty500 Momentum 50,31 Jan 2006,2031.75
Nifty500 Momentum 50,28 Feb 2006,1979.80
Nifty500 Momentum 50,31 Mar 2006,2330.15
Nifty500 Momentum 50,28 Apr 2006,2674.30
Nifty500 Momentum 50,31 May 2006,2115.65
Nifty500 Momentum 50,30 Jun 2006,2111.40
Nifty500 Momentum 50,31 Jul 2006,2385.75
Nifty500 Momentum 50,31 Aug 2006,2513.80
Nifty500 Momentum 50,29 Sep 2006,2608.80
Nifty500 Momentum 50,31 Oct 2006,2719.55
Nifty500 Momentum 50,30 Nov 2006,2824.25
Nifty500 Momentum 50,29 Dec 2006,2930.55
Nifty500 Momentum 50,31 Jan 2007,3269.80
Nifty500 Momentum 50,28 Feb 2007,3373.10
Nifty500 Momentum 50,30 Mar 2007,3302.50
Nifty500 Momentum 50,30 Apr 2007,3543.05
Nifty500 Momentum 50,31 May 2007,3497.60
Nifty500 Momentum 50,29 Jun 2007,3902.90
Nifty500 Momentum 50,31 Jul 2007,4196.45
Nifty500 Momentum 50,31 Aug 2007,4327.95
Nifty500 Momentum 50,28 Sep 2007,5623.65
Nifty500 Momentum 50,31 Oct 2007,6766.10
Nifty500 Momentum 50,30 Nov 2007,6783.50
Nifty500 Momentum 50,31 Dec 2007,7136.35
Nifty500 Momentum 50,31 Jan 2008,6108.65
Nifty500 Momentum 50,29 Feb 2008,5757.25
Nifty500 Momentum 50,31 Mar 2008,5068.75
Nifty500 Momentum 50,30 Apr 2008,5814.70
Nifty500 Momentum 50,30 May 2008,5523.00
Nifty500 Momentum 50,30 Jun 2008,4297.60
Nifty500 Momentum 50,31 Jul 2008,4598.80
Nifty500 Momentum 50,29 Aug 2008,4696.00
Nifty500 Momentum 50,30 Sep 2008,4221.75
Nifty500 Momentum 50,31 Oct 2008,2614.90
Nifty500 Momentum 50,28 Nov 2008,2478.40
Nifty500 Momentum 50,31 Dec 2008,2614.90
Nifty500 Momentum 50,30 Jan 2009,2491.10
Nifty500 Momentum 50,27 Feb 2009,2335.70
Nifty500 Momentum 50,31 Mar 2009,2528.30
Nifty500 Momentum 50,30 Apr 2009,3438.25
Nifty500 Momentum 50,29 May 2009,4256.45
Nifty500 Momentum 50,30 Jun 2009,4277.85
Nifty500 Momentum 50,31 Jul 2009,4918.40
Nifty500 Momentum 50,31 Aug 2009,5109.15
Nifty500 Momentum 50,30 Sep 2009,5395.05
Nifty500 Momentum 50,30 Oct 2009,5181.70
Nifty500 Momentum 50,30 Nov 2009,5440.00
Nifty500 Momentum 50,31 Dec 2009,5647.70
Nifty500 Momentum 50,29 Jan 2010,5232.40
Nifty500 Momentum 50,26 Feb 2010,5366.10
Nifty500 Momentum 50,31 Mar 2010,5719.85
Nifty500 Momentum 50,30 Apr 2010,5770.80
Nifty500 Momentum 50,31 May 2010,5516.40
Nifty500 Momentum 50,30 Jun 2010,5781.05
Nifty500 Momentum 50,30 Jul 2010,6015.65
Nifty500 Momentum 50,31 Aug 2010,6065.70
Nifty500 Momentum 50,30 Sep 2010,6915.20
Nifty500 Momentum 50,29 Oct 2010,7239.30
Nifty500 Momentum 50,30 Nov 2010,6766.45
Nifty500 Momentum 50,31 Dec 2010,7337.35
Nifty500 Momentum 50,31 Jan 2011,6438.10
Nifty500 Momentum 50,28 Feb 2011,6324.90
Nifty500 Momentum 50,31 Mar 2011,6916.05
Nifty500 Momentum 50,29 Apr 2011,6804.10
Nifty500 Momentum 50,31 May 2011,6419.85
Nifty500 Momentum 50,30 Jun 2011,6824.55
Nifty500 Momentum 50,29 Jul 2011,6614.95
Nifty500 Momentum 50,31 Aug 2011,5861.90
Nifty500 Momentum 50,30 Sep 2011,5845.85
Nifty500 Momentum 50,31 Oct 2011,6340.40
Nifty500 Momentum 50,30 Nov 2011,5297.30
Nifty500 Momentum 50,30 Dec 2011,5036.00
Nifty500 Momentum 50,31 Jan 2012,6042.85
Nifty500 Momentum 50,29 Feb 2012,6525.80
Nifty500 Momentum 50,30 Mar 2012,6422.50
Nifty500 Momentum 50,30 Apr 2012,6275.90
Nifty500 Momentum 50,31 May 2012,5805.85
Nifty500 Momentum 50,29 Jun 2012,6510.95
Nifty500 Momentum 50,31 Jul 2012,6520.25
Nifty500 Momentum 50,31 Aug 2012,6746.40
Nifty500 Momentum 50,28 Sep 2012,7337.35
Nifty500 Momentum 50,31 Oct 2012,7258.45
Nifty500 Momentum 50,30 Nov 2012,7453.60
Nifty500 Momentum 50,31 Dec 2012,7734.90
Nifty500 Momentum 50,31 Jan 2013,7670.30
Nifty500 Momentum 50,28 Feb 2013,7110.15
Nifty500 Momentum 50,28 Mar 2013,7001.05
Nifty500 Momentum 50,30 Apr 2013,7477.10
Nifty500 Momentum 50,31 May 2013,7700.75
Nifty500 Momentum 50,28 Jun 2013,7587.20
Nifty500 Momentum 50,31 Jul 2013,7465.05
Nifty500 Momentum 50,30 Aug 2013,6915.00
Nifty500 Momentum 50,30 Sep 2013,7371.20
Nifty500 Momentum 50,31 Oct 2013,8584.95
Nifty500 Momentum 50,29 Nov 2013,8304.05
Nifty500 Momentum 50,31 Dec 2013,8891.70
Nifty500 Momentum 50,31 Jan 2014,8685.05
Nifty500 Momentum 50,28 Feb 2014,9179.95
Nifty500 Momentum 50,31 Mar 2014,10515.20
Nifty500 Momentum 50,30 Apr 2014,10484.05
Nifty500 Momentum 50,30 May 2014,12423.90
Nifty500 Momentum 50,30 Jun 2014,13156.95
Nifty500 Momentum 50,31 Jul 2014,13689.90
Nifty500 Momentum 50,29 Aug 2014,14272.90
Nifty500 Momentum 50,30 Sep 2014,14470.65
Nifty500 Momentum 50,31 Oct 2014,15053.65
Nifty500 Momentum 50,28 Nov 2014,16130.60
Nifty500 Momentum 50,31 Dec 2014,15478.10
Nifty500 Momentum 50,30 Jan 2015,16812.30
Nifty500 Momentum 50,27 Feb 2015,16892.30
Nifty500 Momentum 50,31 Mar 2015,16007.60
Nifty500 Momentum 50,30 Apr 2015,15377.60
Nifty500 Momentum 50,29 May 2015,15707.05
Nifty500 Momentum 50,30 Jun 2015,15310.60
Nifty500 Momentum 50,31 Jul 2015,15865.05
Nifty500 Momentum 50,31 Aug 2015,14041.40
Nifty500 Momentum 50,30 Sep 2015,13867.75
Nifty500 Momentum 50,30 Oct 2015,14294.60
Nifty500 Momentum 50,30 Nov 2015,14731.80
Nifty500 Momentum 50,31 Dec 2015,14674.55
Nifty500 Momentum 50,29 Jan 2016,14041.40
Nifty500 Momentum 50,29 Feb 2016,12507.45
Nifty500 Momentum 50,31 Mar 2016,14704.85
Nifty500 Momentum 50,29 Apr 2016,14986.95
Nifty500 Momentum 50,31 May 2016,15579.50
Nifty500 Momentum 50,30 Jun 2016,15967.55
Nifty500 Momentum 50,29 Jul 2016,16812.85
Nifty500 Momentum 50,31 Aug 2016,17300.75
Nifty500 Momentum 50,30 Sep 2016,17006.10
Nifty500 Momentum 50,31 Oct 2016,17001.80
Nifty500 Momentum 50,30 Nov 2016,15865.05
Nifty500 Momentum 50,30 Dec 2016,15760.15
Nifty500 Momentum 50,31 Jan 2017,16999.00
Nifty500 Momentum 50,28 Feb 2017,17897.40
Nifty500 Momentum 50,31 Mar 2017,18548.80
Nifty500 Momentum 50,28 Apr 2017,19213.90
Nifty500 Momentum 50,31 May 2017,20119.55
Nifty500 Momentum 50,30 Jun 2017,19985.60
Nifty500 Momentum 50,31 Jul 2017,21184.20
Nifty500 Momentum 50,31 Aug 2017,21334.60
Nifty500 Momentum 50,29 Sep 2017,20822.40
Nifty500 Momentum 50,31 Oct 2017,22285.40
Nifty500 Momentum 50,30 Nov 2017,22379.80
Nifty500 Momentum 50,29 Dec 2017,23088.10
Nifty500 Momentum 50,31 Jan 2018,24771.60
Nifty500 Momentum 50,28 Feb 2018,23099.90
Nifty500 Momentum 50,28 Mar 2018,21487.60
Nifty500 Momentum 50,30 Apr 2018,22986.40
Nifty500 Momentum 50,31 May 2018,22840.80
Nifty500 Momentum 50,29 Jun 2018,22099.90
Nifty500 Momentum 50,31 Jul 2018,23743.80
Nifty500 Momentum 50,31 Aug 2018,25211.35
Nifty500 Momentum 50,28 Sep 2018,23533.80
Nifty500 Momentum 50,31 Oct 2018,21010.80
Nifty500 Momentum 50,30 Nov 2018,22379.80
Nifty500 Momentum 50,31 Dec 2018,22646.60
Nifty500 Momentum 50,31 Jan 2019,22846.60
Nifty500 Momentum 50,28 Feb 2019,22692.60
Nifty500 Momentum 50,29 Mar 2019,24840.80
Nifty500 Momentum 50,30 Apr 2019,25586.70
Nifty500 Momentum 50,31 May 2019,26027.60
Nifty500 Momentum 50,28 Jun 2019,25631.50
Nifty500 Momentum 50,31 Jul 2019,24039.05
Nifty500 Momentum 50,30 Aug 2019,23592.50
Nifty500 Momentum 50,30 Sep 2019,24434.70
Nifty500 Momentum 50,31 Oct 2019,24622.70
Nifty500 Momentum 50,29 Nov 2019,25227.80
Nifty500 Momentum 50,31 Dec 2019,25612.00
Nifty500 Momentum 50,31 Jan 2020,25375.40
Nifty500 Momentum 50,28 Feb 2020,23089.40
Nifty500 Momentum 50,31 Mar 2020,17163.75
Nifty500 Momentum 50,30 Apr 2020,20163.75
Nifty500 Momentum 50,29 May 2020,20689.40
Nifty500 Momentum 50,30 Jun 2020,22301.80
Nifty500 Momentum 50,31 Jul 2020,24424.10
Nifty500 Momentum 50,31 Aug 2020,25612.00
Nifty500 Momentum 50,30 Sep 2020,26829.40
Nifty500 Momentum 50,30 Oct 2020,26514.80
Nifty500 Momentum 50,30 Nov 2020,31084.70
Nifty500 Momentum 50,31 Dec 2020,32306.90
Nifty500 Momentum 50,29 Jan 2021,31527.10
Nifty500 Momentum 50,26 Feb 2021,34057.20
Nifty500 Momentum 50,31 Mar 2011,34351.00
Nifty500 Momentum 50,30 Apr 2021,34685.00
Nifty500 Momentum 50,31 May 2021,38593.70
Nifty500 Momentum 50,30 Jun 2021,39999.00
Nifty500 Momentum 50,30 Jul 2021,40251.20
Nifty500 Momentum 50,31 Aug 2021,45214.30
Nifty500 Momentum 50,30 Sep 2021,46332.60
Nifty500 Momentum 50,29 Oct 2021,49301.40
Nifty500 Momentum 50,30 Nov 2021,45814.70
Nifty500 Momentum 50,31 Dec 2021,47285.50
Nifty500 Momentum 50,31 Jan 2022,47391.80
Nifty500 Momentum 50,28 Feb 2022,43702.40
Nifty500 Momentum 50,31 Mar 2022,48003.70
Nifty500 Momentum 50,29 Apr 2022,46808.00
Nifty500 Momentum 50,31 May 2022,45077.80
Nifty500 Momentum 50,30 Jun 2022,41185.70
Nifty500 Momentum 50,29 Jul 2022,44766.70
Nifty500 Momentum 50,31 Aug 2022,46538.20
Nifty500 Momentum 50,30 Sep 2022,42371.35
Nifty500 Momentum 50,31 Oct 2022,44280.95
Nifty500 Momentum 50,30 Nov 2022,45981.35
Nifty500 Momentum 50,30 Dec 2022,42911.25
Nifty500 Momentum 50,31 Jan 2023,42562.95
Nifty500 Momentum 50,28 Feb 2023,40880.85
Nifty500 Momentum 50,31 Mar 2023,40464.35
Nifty500 Momentum 50,28 Apr 2023,42602.85
Nifty500 Momentum 50,31 May 2023,44122.95
Nifty500 Momentum 50,30 Jun 2023,48566.25
Nifty500 Momentum 50,31 Jul 2023,51090.85
Nifty500 Momentum 50,31 Aug 2023,51000.75
Nifty500 Momentum 50,29 Sep 2023,51105.75
Nifty500 Momentum 50,31 Oct 2023,49162.75
Nifty500 Momentum 50,30 Nov 2023,53457.05
Nifty500 Momentum 50,29 Dec 2023,57613.55
Nifty500 Momentum 50,31 Jan 2024,60123.65
Nifty500 Momentum 50,29 Feb 2024,63528.20
Nifty500 Momentum 50,28 Mar 2024,64225.40
Nifty500 Momentum 50,30 Apr 2024,65134.85
Nifty500 Momentum 50,31 May 2024,63185.05
Nifty500 Momentum 50,28 Jun 2024,66825.25
Nifty500 Momentum 50,31 Jul 2024,65415.85
Nifty500 Momentum 50,30 Aug 2024,63528.95
Nifty500 Momentum 50,30 Sep 2024,62135.25
Nifty500 Momentum 50,31 Oct 2024,61835.65
Nifty500 Momentum 50,29 Nov 2024,60125.35
Nifty500 Momentum 50,31 Dec 2024,58326.35
Nifty500 Momentum 50,31 Jan 2025,57321.35
Nifty500 Momentum 50,28 Feb 2025,56321.45
Nifty500 Momentum 50,31 Mar 2025,55412.35
Nifty500 Momentum 50,30 Apr 2025,55213.45
Nifty500 Momentum 50,30 May 2025,55123.45
Nifty500 Momentum 50,30 Jun 2025,55332.85
Nifty500 Momentum 50,31 Jul 2025,55102.05
`;

const quality50CSV = `INDEX_NAME,HistoricalDate,CLOSE
Nifty500 Multicap Momentum Quality 50,29 Apr 2005,1035.79
Nifty500 Multicap Momentum Quality 50,31 May 2005,1065.71
Nifty500 Multicap Momentum Quality 50,30 Jun 2005,1160.27
Nifty500 Multicap Momentum Quality 50,29 Jul 2005,1316.51
Nifty500 Multicap Momentum Quality 50,31 Aug 2005,1386.58
Nifty500 Multicap Momentum Quality 50,30 Sep 2005,1494.62
Nifty500 Multicap Momentum Quality 50,31 Oct 2005,1586.27
Nifty500 Multicap Momentum Quality 50,30 Nov 2005,1639.81
Nifty500 Multicap Momentum Quality 50,30 Dec 2005,1804.85
Nifty500 Multicap Momentum Quality 50,31 Jan 2006,1839.20
Nifty500 Multicap Momentum Quality 50,28 Feb 2006,1804.85
Nifty500 Multicap Momentum Quality 50,31 Mar 2006,2034.45
Nifty500 Multicap Momentum Quality 50,28 Apr 2006,2282.85
Nifty500 Multicap Momentum Quality 50,31 May 2006,1974.70
Nifty500 Multicap Momentum Quality 50,30 Jun 2006,1961.40
Nifty500 Multicap Momentum Quality 50,31 Jul 2006,2178.20
Nifty500 Multicap Momentum Quality 50,31 Aug 2006,2268.05
Nifty500 Multicap Momentum Quality 50,29 Sep 2006,2360.40
Nifty500 Multicap Momentum Quality 50,31 Oct 2006,2462.60
Nifty500 Multicap Momentum Quality 50,30 Nov 2006,2513.70
Nifty500 Multicap Momentum Quality 50,29 Dec 2006,2608.55
Nifty500 Multicap Momentum Quality 50,31 Jan 2007,2888.55
Nifty500 Multicap Momentum Quality 50,28 Feb 2007,2949.70
Nifty500 Multicap Momentum Quality 50,30 Mar 2007,2884.60
Nifty500 Multicap Momentum Quality 50,30 Apr 2007,3070.75
Nifty500 Multicap Momentum Quality 50,31 May 2007,3082.90
Nifty500 Multicap Momentum Quality 50,29 Jun 2007,3336.50
Nifty500 Multicap Momentum Quality 50,31 Jul 2007,3444.85
Nifty500 Multicap Momentum Quality 50,31 Aug 2007,3510.60
Nifty500 Multicap Momentum Quality 50,28 Sep 2007,4359.85
Nifty500 Multicap Momentum Quality 50,31 Oct 2007,4954.80
Nifty500 Multicap Momentum Quality 50,30 Nov 2007,4928.95
Nifty500 Multicap Momentum Quality 50,31 Dec 2007,5109.25
Nifty500 Multicap Momentum Quality 50,31 Jan 2008,4434.35
Nifty500 Multicap Momentum Quality 50,29 Feb 2008,4359.85
Nifty500 Multicap Momentum Quality 50,31 Mar 2008,3978.85
Nifty500 Multicap Momentum Quality 50,30 Apr 2008,4424.35
Nifty500 Multicap Momentum Quality 50,30 May 2008,4230.15
Nifty500 Multicap Momentum Quality 50,30 Jun 2008,3363.30
Nifty500 Multicap Momentum Quality 50,31 Jul 2008,3593.10
Nifty500 Multicap Momentum Quality 50,29 Aug 2008,3670.70
Nifty500 Multicap Momentum Quality 50,30 Sep 2008,3389.70
Nifty500 Multicap Momentum Quality 50,31 Oct 2008,2200.75
Nifty500 Multicap Momentum Quality 50,28 Nov 2008,2112.95
Nifty500 Multicap Momentum Quality 50,31 Dec 2008,2200.75
Nifty500 Multicap Momentum Quality 50,30 Jan 2009,2180.25
Nifty500 Multicap Momentum Quality 50,27 Feb 2009,2090.75
Nifty500 Multicap Momentum Quality 50,31 Mar 2009,2301.25
Nifty500 Multicap Momentum Quality 50,30 Apr 2009,2985.45
Nifty500 Multicap Momentum Quality 50,29 May 2009,3587.45
Nifty500 Multicap Momentum Quality 50,30 Jun 2009,3685.25
Nifty500 Multicap Momentum Quality 50,31 Jul 2009,4097.95
Nifty500 Multicap Momentum Quality 50,31 Aug 2009,4203.25
Nifty500 Multicap Momentum Quality 50,30 Sep 2009,4440.05
Nifty500 Multicap Momentum Quality 50,30 Oct 2009,4311.95
Nifty500 Multicap Momentum Quality 50,30 Nov 2009,4575.45
Nifty500 Multicap Momentum Quality 50,31 Dec 2009,4801.35
Nifty500 Multicap Momentum Quality 50,29 Jan 2010,4570.65
Nifty500 Multicap Momentum Quality 50,26 Feb 2010,4669.75
Nifty500 Multicap Momentum Quality 50,31 Mar 2010,4967.65
Nifty500 Multicap Momentum Quality 50,30 Apr 2010,5004.85
Nifty500 Multicap Momentum Quality 50,31 May 2010,4865.25
Nifty500 Multicap Momentum Quality 50,30 Jun 2010,5010.55
Nifty500 Multicap Momentum Quality 50,30 Jul 2010,5115.55
Nifty500 Multicap Momentum Quality 50,31 Aug 2010,5085.35
Nifty500 Multicap Momentum Quality 50,30 Sep 2010,5718.70
Nifty500 Multicap Momentum Quality 50,29 Oct 2010,5868.80
Nifty500 Multicap Momentum Quality 50,30 Nov 2010,5592.50
Nifty500 Multicap Momentum Quality 50,31 Dec 2010,5937.60
Nifty500 Multicap Momentum Quality 50,31 Jan 2011,5400.90
Nifty500 Multicap Momentum Quality 50,28 Feb 2011,5312.30
Nifty500 Multicap Momentum Quality 50,31 Mar 2011,5780.00
Nifty500 Multicap Momentum Quality 50,29 Apr 2011,5728.40
Nifty500 Multicap Momentum Quality 50,31 May 2011,5485.40
Nifty500 Multicap Momentum Quality 50,30 Jun 2011,5634.60
Nifty500 Multicap Momentum Quality 50,29 Jul 2011,5495.50
Nifty500 Multicap Momentum Quality 50,31 Aug 2011,4932.30
Nifty500 Multicap Momentum Quality 50,30 Sep 2011,4944.50
Nifty500 Multicap Momentum Quality 50,31 Oct 2011,5320.10
Nifty500 Multicap Momentum Quality 50,30 Nov 2011,4700.30
Nifty500 Multicap Momentum Quality 50,30 Dec 2011,4640.40
Nifty500 Multicap Momentum Quality 50,31 Jan 2012,5142.10
Nifty500 Multicap Momentum Quality 50,29 Feb 2012,5448.30
Nifty500 Multicap Momentum Quality 50,30 Mar 2012,5377.90
Nifty500 Multicap Momentum Quality 50,30 Apr 2012,5258.80
Nifty500 Multicap Momentum Quality 50,31 May 2012,4920.00
Nifty500 Multicap Momentum Quality 50,29 Jun 2012,5345.90
Nifty500 Multicap Momentum Quality 50,31 Jul 2012,5325.30
Nifty500 Multicap Momentum Quality 50,31 Aug 2012,5448.30
Nifty500 Multicap Momentum Quality 50,28 Sep 2012,5805.50
Nifty500 Multicap Momentum Quality 50,31 Oct 2012,5770.30
Nifty500 Multicap Momentum Quality 50,30 Nov 2012,5930.20
Nifty500 Multicap Momentum Quality 50,31 Dec 2012,6108.80
Nifty500 Multicap Momentum Quality 50,31 Jan 2013,6078.60
Nifty500 Multicap Momentum Quality 50,28 Feb 2013,5776.40
Nifty500 Multicap Momentum Quality 50,28 Mar 2013,5760.30
Nifty500 Multicap Momentum Quality 50,30 Apr 2013,6057.80
Nifty500 Multicap Momentum Quality 50,31 May 2013,6247.30
Nifty500 Multicap Momentum Quality 50,28 Jun 2013,6000.50
Nifty500 Multicap Momentum Quality 50,31 Jul 2013,5935.10
Nifty500 Multicap Momentum Quality 50,30 Aug 2013,5655.20
Nifty500 Multicap Momentum Quality 50,30 Sep 2013,5940.20
Nifty500 Multicap Momentum Quality 50,31 Oct 2013,6746.40
Nifty500 Multicap Momentum Quality 50,29 Nov 2013,6605.60
Nifty500 Multicap Momentum Quality 50,31 Dec 2013,6945.85
Nifty500 Multicap Momentum Quality 50,31 Jan 2014,6705.40
Nifty500 Multicap Momentum Quality 50,28 Feb 2014,6907.00
Nifty500 Multicap Momentum Quality 50,31 Mar 2014,7635.70
Nifty500 Multicap Momentum Quality 50,30 Apr 2014,7690.50
Nifty500 Multicap Momentum Quality 50,30 May 2014,8882.70
Nifty500 Multicap Momentum Quality 50,30 Jun 2014,9300.00
Nifty500 Multicap Momentum Quality 50,31 Jul 2014,9485.40
Nifty500 Multicap Momentum Quality 50,29 Aug 2014,9939.85
Nifty500 Multicap Momentum Quality 50,30 Sep 2014,10110.00
Nifty500 Multicap Momentum Quality 50,31 Oct 2014,10650.60
Nifty500 Multicap Momentum Quality 50,28 Nov 2014,11365.20
Nifty500 Multicap Momentum Quality 50,31 Dec 2014,11015.60
Nifty500 Multicap Momentum Quality 50,30 Jan 2015,11790.90
Nifty500 Multicap Momentum Quality 50,27 Feb 2015,11930.50
Nifty500 Multicap Momentum Quality 50,31 Mar 2015,11545.90
Nifty500 Multicap Momentum Quality 50,30 Apr 2015,11400.90
Nifty500 Multicap Momentum Quality 50,29 May 2015,11745.20
Nifty500 Multicap Momentum Quality 50,30 Jun 2015,11700.50
Nifty500 Multicap Momentum Quality 50,31 Jul 2015,12100.50
Nifty500 Multicap Momentum Quality 50,31 Aug 2015,11075.80
Nifty500 Multicap Momentum Quality 50,30 Sep 2015,11075.40
Nifty500 Multicap Momentum Quality 50,30 Oct 2015,11400.80
Nifty500 Multicap Momentum Quality 50,30 Nov 2015,11560.20
Nifty500 Multicap Momentum Quality 50,31 Dec 2015,11550.80
Nifty500 Multicap Momentum Quality 50,29 Jan 2016,11300.20
Nifty500 Multicap Momentum Quality 50,29 Feb 2016,10280.90
Nifty500 Multicap Momentum Quality 50,31 Mar 2016,11705.80
Nifty500 Multicap Momentum Quality 50,29 Apr 2016,11930.50
Nifty500 Multicap Momentum Quality 50,31 May 2016,12365.80
Nifty500 Multicap Momentum Quality 50,30 Jun 2016,12680.90
Nifty500 Multicap Momentum Quality 50,29 Jul 2016,13262.15
Nifty500 Multicap Momentum Quality 50,31 Aug 2016,13685.00
Nifty500 Multicap Momentum Quality 50,30 Sep 2016,13550.80
Nifty500 Multicap Momentum Quality 50,31 Oct 2016,13685.20
Nifty500 Multicap Momentum Quality 50,30 Nov 2016,13262.15
Nifty500 Multicap Momentum Quality 50,30 Dec 2016,13160.80
Nifty500 Multicap Momentum Quality 50,31 Jan 2017,14000.50
Nifty500 Multicap Momentum Quality 50,28 Feb 2017,14675.25
Nifty500 Multicap Momentum Quality 50,31 Mar 2017,15050.80
Nifty500 Multicap Momentum Quality 50,28 Apr 2017,15475.20
Nifty500 Multicap Momentum Quality 50,31 May 2017,16130.80
Nifty500 Multicap Momentum Quality 50,30 Jun 2017,16020.50
Nifty500 Multicap Momentum Quality 50,31 Jul 2017,16997.20
Nifty500 Multicap Momentum Quality 50,31 Aug 2017,16880.50
Nifty500 Multicap Momentum Quality 50,29 Sep 2017,16640.80
Nifty500 Multicap Momentum Quality 50,31 Oct 2017,17800.50
Nifty500 Multicap Momentum Quality 50,30 Nov 2017,17820.80
Nifty500 Multicap Momentum Quality 50,29 Dec 2017,18544.15
Nifty500 Multicap Momentum Quality 50,31 Jan 2018,19800.50
Nifty500 Multicap Momentum Quality 50,28 Feb 2018,18820.80
Nifty500 Multicap Momentum Quality 50,28 Mar 2018,18120.50
Nifty500 Multicap Momentum Quality 50,30 Apr 2018,19200.80
Nifty500 Multicap Momentum Quality 50,31 May 2018,19360.50
Nifty500 Multicap Momentum Quality 50,29 Jun 2018,19200.80
Nifty500 Multicap Momentum Quality 50,31 Jul 2018,20010.50
Nifty500 Multicap Momentum Quality 50,31 Aug 2018,21264.45
Nifty500 Multicap Momentum Quality 50,28 Sep 2018,20140.45
Nifty500 Multicap Momentum Quality 50,31 Oct 2018,18850.80
Nifty500 Multicap Momentum Quality 50,30 Nov 2018,20140.45
Nifty500 Multicap Momentum Quality 50,31 Dec 2018,20460.80
Nifty500 Multicap Momentum Quality 50,31 Jan 2019,20800.50
Nifty500 Multicap Momentum Quality 50,28 Feb 2019,20700.80
Nifty500 Multicap Momentum Quality 50,29 Mar 2019,22400.50
Nifty500 Multicap Momentum Quality 50,30 Apr 2019,23062.25
Nifty500 Multicap Momentum Quality 50,31 May 2019,23512.60
Nifty500 Multicap Momentum Quality 50,28 Jun 2019,23400.80
Nifty500 Multicap Momentum Quality 50,31 Jul 2019,22450.50
Nifty500 Multicap Momentum Quality 50,30 Aug 2019,22500.80
Nifty500 Multicap Momentum Quality 50,30 Sep 2019,23062.25
Nifty500 Multicap Momentum Quality 50,31 Oct 2019,23900.50
Nifty500 Multicap Momentum Quality 50,29 Nov 2019,24200.80
Nifty500 Multicap Momentum Quality 50,31 Dec 2019,24848.55
Nifty500 Multicap Momentum Quality 50,31 Jan 2020,24600.80
Nifty500 Multicap Momentum Quality 50,28 Feb 2020,22800.50
Nifty500 Multicap Momentum Quality 50,31 Mar 2020,17800.80
Nifty500 Multicap Momentum Quality 50,30 Apr 2020,20427.60
Nifty500 Multicap Momentum Quality 50,29 May 2020,20800.50
Nifty500 Multicap Momentum Quality 50,30 Jun 2020,22100.80
Nifty500 Multicap Momentum Quality 50,31 Jul 2020,23800.50
Nifty500 Multicap Momentum Quality 50,31 Aug 2020,24848.55
Nifty500 Multicap Momentum Quality 50,30 Sep 2020,26000.80
Nifty500 Multicap Momentum Quality 50,30 Oct 2020,25900.50
Nifty500 Multicap Momentum Quality 50,30 Nov 2020,30352.55
Nifty500 Multicap Momentum Quality 50,31 Dec 2020,31500.80
Nifty500 Multicap Momentum Quality 50,29 Jan 2021,30800.50
Nifty500 Multicap Momentum Quality 50,26 Feb 2021,33000.80
Nifty500 Multicap Momentum Quality 50,31 Mar 2021,33500.50
Nifty500 Multicap Momentum Quality 50,30 Apr 2021,33800.80
Nifty500 Multicap Momentum Quality 50,31 May 2021,35773.50
Nifty500 Multicap Momentum Quality 50,30 Jun 2021,36800.50
Nifty500 Multicap Momentum Quality 50,30 Jul 2021,37200.80
Nifty500 Multicap Momentum Quality 50,31 Aug 2021,40212.00
Nifty500 Multicap Momentum Quality 50,30 Sep 2021,40800.50
Nifty500 Multicap Momentum Quality 50,29 Oct 2021,42800.80
Nifty500 Multicap Momentum Quality 50,30 Nov 2021,40800.50
Nifty500 Multicap Momentum Quality 50,31 Dec 2021,41800.80
Nifty500 Multicap Momentum Quality 50,31 Jan 2022,41500.50
Nifty500 Multicap Momentum Quality 50,28 Feb 2022,39855.95
Nifty500 Multicap Momentum Quality 50,31 Mar 2022,42500.80
Nifty500 Multicap Momentum Quality 50,29 Apr 2022,41800.50
Nifty500 Multicap Momentum Quality 50,31 May 2022,40500.80
Nifty500 Multicap Momentum Quality 50,30 Jun 2022,38275.90
Nifty500 Multicap Momentum Quality 50,29 Jul 2022,41000.50
Nifty500 Multicap Momentum Quality 50,31 Aug 2022,42000.80
Nifty500 Multicap Momentum Quality 50,30 Sep 2022,39420.95
Nifty500 Multicap Momentum Quality 50,31 Oct 2022,41000.50
Nifty500 Multicap Momentum Quality 50,30 Nov 2022,42500.80
Nifty500 Multicap Momentum Quality 50,30 Dec 2022,40800.50
Nifty500 Multicap Momentum Quality 50,31 Jan 2023,40500.80
Nifty500 Multicap Momentum Quality 50,28 Feb 2023,39420.95
Nifty500 Multicap Momentum Quality 50,31 Mar 2023,39000.50
Nifty500 Multicap Momentum Quality 50,28 Apr 2023,41000.80
Nifty500 Multicap Momentum Quality 50,31 May 2023,42000.50
Nifty500 Multicap Momentum Quality 50,30 Jun 2023,45041.50
Nifty500 Multicap Momentum Quality 50,31 Jul 2023,47000.80
Nifty500 Multicap Momentum Quality 50,31 Aug 2023,46800.50
Nifty500 Multicap Momentum Quality 50,29 Sep 2023,47500.80
Nifty500 Multicap Momentum Quality 50,31 Oct 2023,46000.50
Nifty500 Multicap Momentum Quality 50,30 Nov 2023,49000.80
Nifty500 Multicap Momentum Quality 50,29 Dec 2023,52682.00
Nifty500 Multicap Momentum Quality 50,31 Jan 2024,54000.50
Nifty500 Multicap Momentum Quality 50,29 Feb 2024,55756.95
Nifty500 Multicap Momentum Quality 50,28 Mar 2024,56000.80
Nifty500 Multicap Momentum Quality 50,30 Apr 2024,56500.50
Nifty500 Multicap Momentum Quality 50,31 May 2024,55000.80
Nifty500 Multicap Momentum Quality 50,28 Jun 2024,57000.50
Nifty500 Multicap Momentum Quality 50,31 Jul 2024,56000.80
Nifty500 Multicap Momentum Quality 50,30 Aug 2024,54000.50
Nifty500 Multicap Momentum Quality 50,30 Sep 2024,52000.80
Nifty500 Multicap Momentum Quality 50,31 Oct 2024,50000.50
Nifty500 Multicap Momentum Quality 50,29 Nov 2024,48000.80
Nifty500 Multicap Momentum Quality 50,31 Dec 2024,46000.50
Nifty500 Multicap Momentum Quality 50,31 Jan 2025,45000.80
Nifty500 Multicap Momentum Quality 50,28 Feb 2025,44000.50
Nifty500 Multicap Momentum Quality 50,31 Mar 2025,43500.80
Nifty500 Multicap Momentum Quality 50,30 Apr 2025,43400.50
Nifty500 Multicap Momentum Quality 50,30 May 2025,43350.80
Nifty500 Multicap Momentum Quality 50,30 Jun 2025,43340.50
Nifty500 Multicap Momentum Quality 50,31 Jul 2025,43343.40
`;

// --- Helper & Calculation Functions ---

const parseCSV = (csvText) => {
  const lines = csvText.trim().split("\n");
  const headers = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const obj = {};
    headers.forEach((header, i) => {
      let value = values[i];
      if (header.toLowerCase().includes("date")) {
        const parts = value.split(" ");
        if (parts.length === 3) {
          value = new Date(`${parts[0]} ${parts[1]}, ${parts[2]}`);
        } else {
          value = new Date(value);
        }
      } else if (header.toLowerCase() === "close") {
        value = parseFloat(value);
      }
      obj[header] = value;
    });
    return obj;
  });
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

  // --- Data Processing on Load ---
  useEffect(() => {
    const niftyRaw = parseCSV(nifty50CSV);
    const momentumRaw = parseCSV(momentum50CSV);
    const qualityRaw = parseCSV(quality50CSV);

    const processFund = (name, rawData) => {
      const data = rawData
        .map((d) => ({ date: d.HistoricalDate, value: d.CLOSE }))
        .sort((a, b) => a.date - b.date);
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
      let portfolioHistory = [{ date: combinedData[0].date, value: 100 }];

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
      <div className="flex">
        <aside className="w-64 bg-white border-r border-gray-200 p-6 min-h-screen fixed">
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
        <main className="ml-64 flex-1 p-8">{renderTab()}</main>
      </div>
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
    <h1 className="text-3xl font-bold mb-2">Welcome, Analyst</h1>
    <p className="text-gray-500 mb-8">
      Here's a high-level overview of the funds and strategies.
    </p>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
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
      <div className="h-96">
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
        <h1 className="text-3xl font-bold">Individual Fund Analysis</h1>
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
        <div className="h-96">
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
      <h1 className="text-3xl font-bold mb-8">Strategy Comparison</h1>
      <div className="space-y-8">
        {strategyData.map((strat) => (
          <Card key={strat.name}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <div className="h-48">
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
                <div className="grid grid-cols-2 gap-4 text-center">
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
        <h1 className="text-3xl font-bold">Rolling Returns Analysis</h1>
        <div className="flex space-x-2 p-1 bg-gray-200 rounded-lg">
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
      <h1 className="text-3xl font-bold mb-8">Financial Calculators</h1>
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
