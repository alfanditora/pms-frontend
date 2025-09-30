"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type ApprovalStatus = "APPROVED" | "REJECTED" | "PENDING";

export type ExecutiveSummaryType = {
  ippId: string;
  npk: string;
  username: string;
  department: string;
  category: string;
  summary: {
    year: number;
    month: number;
    total_activity: number;
    count_activity: number;
    achieve: number;
    not_achieve: number;
    count_weight: number;
    achieve_weight: number;
    monthly_activity_achievement_count: number;
    monthly_approval: ApprovalStatus;
  }[];
  total_average: number;
};

export function ExecutiveSummary({
  data,
  isPdf = false,
}: {
  data: ExecutiveSummaryType;
  isPdf?: boolean;
}) {
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const getApprovalBadge = (status: ApprovalStatus) => {
    switch (status) {
      case "APPROVED":
        return (
          <Badge style={{ backgroundColor: "#bbf7d0", color: "#166534", fontSize: "0.75rem" }}>
            APPROVED
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge style={{ backgroundColor: "#fecaca", color: "#7f1d1d", fontSize: "0.75rem" }}>
            REJECTED
          </Badge>
        );
      case "PENDING":
        return (
          <Badge style={{ backgroundColor: "#fef08a", color: "#713f12", fontSize: "0.75rem" }}>
            PENDING
          </Badge>
        );
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  const year = data.summary[0]?.year || new Date().getFullYear();

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl font-bold mb-2">Executive Summary</CardTitle>
              <div className="text-lg font-semibold text-foreground">
                {data.username || "N/A"}
              </div>
              <div className="text-sm text-muted-foreground">
                NPK: {data.npk || "N/A"}
              </div>
              <div className="text-sm text-muted-foreground">
                Department: {data.department || "N/A"}
              </div>
              <div className="text-sm text-muted-foreground">
                Category: {data.category || "N/A"}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{year}</div>
              <div className="text-sm text-muted-foreground">January - December</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-border p-3 text-left font-semibold min-w-[200px]">
                    Metric
                  </th>
                  {monthNames.map((month, i) => (
                    <th key={i} className="border border-border p-3 text-center font-semibold min-w-[80px]">
                      {month}
                    </th>
                  ))}
                  <th className="border border-border p-3 text-center font-semibold min-w-[100px]">
                    TOT/AVG
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Total Activity */}
                <tr className="hover:bg-gray-50">
                  <td className="border border-border p-3 font-medium">
                    Total Activity
                  </td>
                  {data.summary.map((m, i) => (
                    <td key={i} className="border border-border p-3 text-center">
                      {m.total_activity}
                    </td>
                  ))}
                </tr>

                {/* Count Activity */}
                <tr className="hover:bg-gray-50">
                  <td className="border border-border p-3 font-medium px-10">
                    Count Activity
                  </td>
                  {data.summary.map((m, i) => (
                    <td key={i} className="border border-border p-3 text-center">
                      {m.count_activity}
                    </td>
                  ))}
                  <td rowSpan={7} className="border border-border p-3 text-center align-middle">
                    <div className="text-2xl font-bold text-blue-600">
                      {data.total_average.toFixed(2)}%
                    </div>
                  </td>
                </tr>

                {/* Achieve */}
                <tr className="hover:bg-gray-50">
                  <td className="border border-border p-3 font-medium px-20">
                    Achieve
                  </td>
                  {data.summary.map((m, i) => (
                    <td key={i} className="border border-border p-3 text-center">
                      {m.achieve}
                    </td>
                  ))}
                </tr>

                {/* Not Achieve */}
                <tr className="hover:bg-gray-50">
                  <td className="border border-border p-3 font-medium px-20">
                    Not Achieve
                  </td>
                  {data.summary.map((m, i) => (
                    <td key={i} className="border border-border p-3 text-center">
                      {m.not_achieve}
                    </td>
                  ))}
                </tr>

                {/* Not Count */}
                <tr className="hover:bg-gray-50">
                  <td className="border border-border p-3 px-10">
                    Not Count
                  </td>
                  {data.summary.map((m, i) => {
                    const notCount = m.total_activity - m.count_activity;
                    return (
                      <td key={i} className="border border-border p-3 text-center">
                        {notCount}
                      </td>
                    );
                  })}
                </tr>

                {/* Count Weight */}
                <tr className="hover:bg-gray-50">
                  <td className="border border-border p-3 font-medium">
                    Count Weight
                  </td>
                  {data.summary.map((m, i) => (
                    <td key={i} className="border border-border p-3 text-center">
                      {m.count_weight.toFixed(1)}%
                    </td>
                  ))}
                </tr>

                {/* Achieve Weight */}
                <tr className="hover:bg-gray-50">
                  <td className="border border-border p-3 font-medium">
                    Achieve Weight (W x A)
                  </td>
                  {data.summary.map((m, i) => (
                    <td key={i} className="border border-border p-3 text-center">
                      {m.achieve_weight.toFixed(1)}%
                    </td>
                  ))}
                </tr>

                {/* Monthly Achievement */}
                <tr>
                  <td className="border border-border p-3 font-medium">
                    Monthly Activity Achievement Count
                  </td>
                  {data.summary.map((m, i) => {
                    const achievementPercentage = m.monthly_activity_achievement_count * 100;
                    const isAchieved = achievementPercentage > 0;
                    return (
                      <td
                        key={i}
                        style={{
                          backgroundColor: isAchieved ? "#bbf7d0" : "#fef08a",
                          color: isAchieved ? "#166534" : "#713f12",
                          fontWeight: "600",
                        }}
                        className="border border-border p-3 text-center"
                      >
                        {achievementPercentage.toFixed(1)}%
                      </td>
                    );
                  })}
                </tr>

                {/* Approval */}
                <tr className="hover:bg-gray-50">
                  <td className="border border-border p-3 font-medium">
                    Approval by Dept Head
                  </td>
                  {data.summary.map((m, i) => (
                    <td key={i} className="border border-border p-3 text-center">
                      {getApprovalBadge(m.monthly_approval)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Review Notes hanya muncul di PDF */}
      {isPdf && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Review Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="min-h-[100px] p-4 border border-border rounded-md bg-gray-100">
              <p className="text-sm text-gray-600 italic">
                No review notes available
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}