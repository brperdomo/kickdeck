<div className="max-w-4xl mx-auto w-full p-6 bg-white rounded-lg shadow-md">
        {event?.branding?.logoUrl && (
          <div className="flex justify-center mb-4">
            <img 
              src={event.branding.logoUrl} 
              alt={`${event?.name || 'Event'} Logo`} 
              className="max-h-32 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/uploads/MatchProAI_Linear_BlackNOBUFFER.png";
                (e.target as HTMLImageElement).alt = "Default Logo";
              }}
            />
          </div>
        )}
        <h1 className="text-2xl font-bold text-center mb-6">{event?.name}</h1>
</div>