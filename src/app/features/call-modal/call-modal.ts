import { Component, inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-call-modal',
  imports: [RouterLink],
  templateUrl: './call-modal.html',
  styleUrl: './call-modal.css',
})
export class CallModal {
  private route = inject(ActivatedRoute);
  id = this.route.snapshot.paramMap.get('id') ?? '';

  micControl = new FormControl(true, { nonNullable: true });
  videoControl = new FormControl(true, { nonNullable: true });

  mic = toSignal(this.micControl.valueChanges, { initialValue: true });
  video = toSignal(this.videoControl.valueChanges, { initialValue: true });

  toggleMic() {
    this.micControl.setValue(!this.mic());
  }

  toggleVideo() {
    this.videoControl.setValue(!this.video());
  }
}
