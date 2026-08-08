import React from "react";
import { EventItem } from "@/data/mockData";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { Clock, Users, Video, Calendar as CalendarIcon, CheckCircle } from "lucide-react";

export interface CalendarCardProps {
  event: EventItem;
  onRSVP?: (id: string) => void;
}

export const CalendarCard: React.FC<CalendarCardProps> = ({ event, onRSVP }) => {
  // Parse Month and Day from string like "Aug 08, 2026"
  const dateParts = event.date.split(" ");
  const month = dateParts[0] || "AUG";
  const day = dateParts[1] ? dateParts[1].replace(",", "") : "08";

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:border-blue-200 hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      <div>
        <div className="flex items-start gap-4 mb-3">
          {/* Date Badge Box */}
          <div className="bg-gradient-to-b from-[#0F4CFF] to-blue-700 text-white rounded-xl p-2.5 w-14 text-center shrink-0 shadow-sm">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-blue-200">
              {month}
            </span>
            <span className="block text-xl font-black leading-none mt-0.5">
              {day}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="primary" size="sm">
                {event.type}
              </Badge>
              {event.isRSVPed && (
                <Badge variant="success" size="sm" dot>
                  Confirmed RSVP
                </Badge>
              )}
            </div>
            <h4 className="text-base font-bold text-slate-900 leading-snug line-clamp-2 hover:text-[#0F4CFF] transition-colors cursor-pointer">
              {event.title}
            </h4>
          </div>
        </div>

        <p className="text-xs text-slate-500 line-clamp-2 mb-4">
          {event.description}
        </p>

        {/* Event Details */}
        <div className="space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600 mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{event.time} ({event.duration})</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>{event.attendeesCount} Facilitators Attending</span>
          </div>
          {event.speaker && (
            <div className="flex items-center gap-2">
              <img
                src={event.speaker.avatar}
                alt={event.speaker.name}
                className="w-4 h-4 rounded-full object-cover border border-slate-200"
              />
              <span className="font-medium text-slate-700">{event.speaker.name}</span>
              <span className="text-slate-400">({event.speaker.role})</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
        {event.isRSVPed ? (
          <Button variant="soft" size="sm" fullWidth icon={<CheckCircle className="w-4 h-4 text-emerald-600" />}>
            Attending (Saved)
          </Button>
        ) : (
          <Button variant="primary" size="sm" fullWidth icon={<CalendarIcon className="w-4 h-4" />}>
            Reserve My Seat
          </Button>
        )}
        {event.zoomUrl && (
          <Button variant="outline" size="icon" title="Join Zoom Room">
            <Video className="w-4 h-4 text-[#0F4CFF]" />
          </Button>
        )}
      </div>
    </div>
  );
};
