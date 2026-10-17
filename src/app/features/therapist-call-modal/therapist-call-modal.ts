import { Component, inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-therapist-call-modal',
  imports: [RouterLink],
  templateUrl: './therapist-call-modal.html',
  styleUrl: './therapist-call-modal.css',
})
export class TherapistCallModal {
  private route = inject(ActivatedRoute);
  id = this.route.snapshot.paramMap.get('id') ?? '';
  micControl = new FormControl(true, { nonNullable: true });
  cameraControl = new FormControl(true, { nonNullable: true });
  mic = toSignal(this.micControl.valueChanges, { initialValue: true });
  camera = toSignal(this.cameraControl.valueChanges, { initialValue: true });
  toggleMic() {
    this.micControl.setValue(!this.mic());
  }
  toggleCamera() {
    this.cameraControl.setValue(!this.camera());
  }
}
