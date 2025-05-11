      {/* Team Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <div className="sticky top-0 z-10 bg-gradient-to-r from-primary/20 to-primary/5 px-6 py-4 border-b border-muted">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Trophy className="h-6 w-6 text-primary" />
                <DialogTitle className="text-xl font-bold">{selectedTeam?.name}</DialogTitle>
              </div>
              <DialogDescription className="text-muted-foreground">
                Team Details
              </DialogDescription>
            </DialogHeader>
          </div>
          
          {selectedTeam && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Team Info */}
                <div className="bg-card rounded-lg shadow-sm border border-muted p-4">
                  <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                    <Info className="h-4 w-4 text-primary" />
                    Team Information
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-1.5 border-b">
                      <span className="text-muted-foreground">Status:</span>
                      <TeamStatusBadge status={selectedTeam.status} />
                    </div>
                    
                    <div className="flex justify-between items-center py-1.5 border-b">
                      <span className="text-muted-foreground">Age Group:</span>
                      <span>{selectedTeam.ageGroup?.ageGroup || 'N/A'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-1.5 border-b">
                      <span className="text-muted-foreground">Club:</span>
                      <span>{selectedTeam.clubName || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                
                {/* Contact Info */}
                <div className="bg-card rounded-lg shadow-sm border border-muted p-4">
                  <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    Contact Information
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-1.5 border-b">
                      <span className="text-muted-foreground">Manager:</span>
                      <span>{selectedTeam.managerName || 'N/A'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-1.5 border-b">
                      <span className="text-muted-foreground">Email:</span>
                      <span>{selectedTeam.managerEmail || 'N/A'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-1.5 border-b">
                      <span className="text-muted-foreground">Phone:</span>
                      <span>{selectedTeam.managerPhone || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Payment Info */}
              <div className="bg-card rounded-lg shadow-sm border border-muted p-4 mt-6">
                <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  Payment Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-1.5 border-b">
                      <span className="text-muted-foreground">Payment Status:</span>
                      <PaymentStatusBadge status={selectedTeam.paymentStatus} />
                    </div>
                    
                    <div className="flex justify-between items-center py-1.5 border-b">
                      <span className="text-muted-foreground">Fee:</span>
                      <span>{formatCurrency(selectedTeam.registrationFee || 0)}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {selectedTeam.cardLast4 && (
                      <div className="flex justify-between items-center py-1.5 border-b">
                        <span className="text-muted-foreground">Card:</span>
                        <span>•••• {selectedTeam.cardLast4}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center py-1.5 border-b">
                      <span className="text-muted-foreground">Registration Date:</span>
                      <span>{formatDate(selectedTeam.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-end mt-6">
                <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>