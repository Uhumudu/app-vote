import { useEffect, useState } from "react";
import api from "../services/api";

export default function useStats() {
  const [stats, setStats] = useState({});

  const fetchStats = async () => {
    const res = await api.get("/admin/stats");
    setStats(res.data);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return { stats, fetchStats };
}