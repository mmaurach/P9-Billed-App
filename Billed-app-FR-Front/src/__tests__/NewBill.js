/**
 * @jest-environment jsdom
 */

import { screen } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { localStorageMock } from "../__mocks__/localStorage.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then ...", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      //to-do write assertion
    });
  });
  describe("When I am on NewBill Page and I upload a invalid file", () => {
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
      })
    );
    test("Must display an alert and reset the field", () => {
      window.alert = jest.fn();
      const newBill = new NewBill({
        document: document,
        onNavigate: jest.fn(),
        store: null,
        localStorage: window.localStorage,
      });
      const fakeEvent = {
        preventDefault: jest.fn(),
        target: {
          value: "C:\\fakepath\\test.txt",
          files: [new File(["test"], "test.txt", { type: "text/plain" })],
        },
      };
      newBill.handleChangeFile(fakeEvent);
      expect(window.alert).toHaveBeenCalledWith(
        "Format de fichier invalide. Seuls les fichiers JPEG, JPG et PNG sont autorisés."
      );
      expect(fakeEvent.target.value).toBe("");
    });
  });
});
