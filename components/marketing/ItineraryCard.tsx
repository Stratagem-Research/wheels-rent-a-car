"use client";

import { Clock, MapPin } from "lucide-react";
import { Card } from "@/components/ui/Card";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalTitle,
  ModalTrigger,
} from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { formatUsd } from "@/lib/booking/pricing";
import type { ChauffeurItinerary } from "@/types/domain";

/**
 * Click-to-modal itinerary card per 07_chauffeur.md §4.
 */

export interface ItineraryCardProps {
  itinerary: ChauffeurItinerary;
  onRequest: (name: string) => void;
}

export function ItineraryCard({ itinerary, onRequest }: ItineraryCardProps) {
  return (
    <Modal>
      <ModalTrigger asChild>
        <button
          type="button"
          className="focus-visible:outline-ink-100 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <Card variant="default" hoverable className="flex h-full cursor-pointer flex-col gap-2">
            <h3 className="headline-sm text-ink-95">{itinerary.name}</h3>
            <div className="label-md text-ink-60 inline-flex items-center gap-1.5">
              <Clock className="size-3.5" aria-hidden="true" /> {itinerary.durationHours} hours
            </div>
            <div className="label-md text-ink-60 inline-flex items-center gap-1.5">
              <MapPin className="size-3.5" aria-hidden="true" /> {itinerary.route}
            </div>
            <div className="mt-2">
              <span className="label-md text-ink-50">from</span>{" "}
              <span className="price-md text-ink-95">{formatUsd(itinerary.fromCents)}</span>
            </div>
            <span className="label-md text-ink-100 mt-1 self-start">View details →</span>
          </Card>
        </button>
      </ModalTrigger>
      <ModalContent size="sm">
        <ModalTitle>{itinerary.name}</ModalTitle>
        <ModalDescription>{itinerary.route}</ModalDescription>
        <div className="mt-4 flex flex-col gap-3">
          <div className="body-sm text-ink-60 flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4" aria-hidden="true" /> {itinerary.durationHours} hours
            </span>
            <span>
              <span className="label-md text-ink-50">from</span> {formatUsd(itinerary.fromCents)}
            </span>
          </div>
          <p className="body-md text-ink-80">{itinerary.description}</p>
          <p className="label-md text-ink-50">
            Includes: chauffeur, fuel, insurance, parking. Custom stops on request.
          </p>
        </div>
        <ModalFooter>
          <Button variant="secondary">Close</Button>
          <Button variant="primary" onClick={() => onRequest(itinerary.name)}>
            Request this itinerary
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
